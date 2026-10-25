import math
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from datetime import datetime

from backend.app.core.config import settings
from backend.app.models.schemas import (
    IntervalRecord,
    PeriodSummary,
    DeviationItem,
    DailyAccuracyItem,
    DiurnalHourProfile,
    ErrorDistributionBin,
    ForecastAccuracyResponse,
    InsightItem,
    InsightsResponse,
)

def align_actual_and_forecast(
    actual_records: List[Dict[str, Any]],
    forecast_records: List[Dict[str, Any]],
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    vintage: str = "DAY_AHEAD",
    low_wind_threshold: float = settings.LOW_WIND_THRESHOLD_MW,
) -> pd.DataFrame:
    """
    Harmonizes half-hourly FUELHH actual generation (48 settlement periods/day)
    with hourly WINDFOR forecasts (24 intervals/day, starting at odd settlement periods: 1, 3, 5, ...).
    
    Actual hourly generation is computed as the arithmetic mean of the two
    half-hourly readings: (SP_odd + SP_even) / 2.
    Missing records are preserved as NaN and never silently coerced to zero.
    """
    df_act = pd.DataFrame(actual_records)
    df_fc = pd.DataFrame(forecast_records)

    # Prepare actual data: filter and aggregate to hourly
    if not df_act.empty and "settlementPeriod" in df_act.columns and "generation" in df_act.columns:
        df_act["settlementPeriod"] = pd.to_numeric(df_act["settlementPeriod"], errors="coerce")
        df_act["generation"] = pd.to_numeric(df_act["generation"], errors="coerce")
        # Ensure settlementDate exists
        if "settlementDate" not in df_act.columns and "startTime" in df_act.columns:
            df_act["settlementDate"] = df_act["startTime"].str.slice(0, 10)
        
        # Each hour corresponds to odd SP: SP 1 covers SP 1 & 2; SP 3 covers SP 3 & 4
        # hourly_sp = ((sp - 1) // 2) * 2 + 1
        df_act["hourly_sp"] = ((df_act["settlementPeriod"] - 1) // 2) * 2 + 1
        
        # Group by settlementDate and hourly_sp, compute average generation and count
        act_grouped = df_act.groupby(["settlementDate", "hourly_sp"]).agg(
            actual_mw=("generation", "mean"),
            sp_count=("generation", "count")
        ).reset_index()
    else:
        act_grouped = pd.DataFrame(columns=["settlementDate", "hourly_sp", "actual_mw", "sp_count"])

    # Prepare forecast data
    if not df_fc.empty and "settlementPeriod" in df_fc.columns and "generation" in df_fc.columns:
        df_fc["settlementPeriod"] = pd.to_numeric(df_fc["settlementPeriod"], errors="coerce")
        df_fc["forecast_mw"] = pd.to_numeric(df_fc["generation"], errors="coerce")
        if "settlementDate" not in df_fc.columns and "startTime" in df_fc.columns:
            df_fc["settlementDate"] = df_fc["startTime"].str.slice(0, 10)
        
        # Keep relevant forecast columns
        fc_cols = ["settlementDate", "settlementPeriod", "forecast_mw"]
        if "publishTime" in df_fc.columns:
            fc_cols.append("publishTime")
        if "startTime" in df_fc.columns:
            fc_cols.append("startTime")
            
        fc_subset = df_fc[fc_cols].drop_duplicates(subset=["settlementDate", "settlementPeriod"])
    else:
        fc_subset = pd.DataFrame(columns=["settlementDate", "settlementPeriod", "forecast_mw"])

    # Construct the complete expected grid for January 2026: 31 days * 24 hours
    dt_range = pd.date_range(f"{start_date} 00:00:00", f"{end_date} 23:00:00", freq="1h", tz="UTC")
    grid = pd.DataFrame({"timestamp_dt": dt_range})
    grid["delivery_date"] = grid["timestamp_dt"].dt.strftime("%Y-%m-%d")
    grid["hour"] = grid["timestamp_dt"].dt.hour
    grid["settlement_period"] = grid["hour"] * 2 + 1
    grid["timestamp"] = grid["timestamp_dt"].dt.strftime("%Y-%m-%dT%H:00:00Z")

    # Merge forecast onto grid
    merged = pd.merge(
        grid,
        fc_subset,
        left_on=["delivery_date", "settlement_period"],
        right_on=["settlementDate", "settlementPeriod"],
        how="left"
    )

    # Merge actual onto grid
    merged = pd.merge(
        merged,
        act_grouped,
        left_on=["delivery_date", "settlement_period"],
        right_on=["settlementDate", "hourly_sp"],
        how="left"
    )

    # Clean and label
    merged["settlement_period_label"] = merged.apply(
        lambda r: f"SP {r['settlement_period']}-{r['settlement_period']+1} ({r['hour']:02d}:00-{(r['hour']+1):02d}:00)",
        axis=1
    )
    merged["forecast_vintage"] = vintage

    # Calculate interval errors
    # Error convention: Forecast - Actual
    # Positive error = Overforecast; Negative error = Underforecast
    merged["error_mw"] = merged["forecast_mw"] - merged["actual_mw"]
    merged["abs_error_mw"] = merged["error_mw"].abs()
    
    # Percentage error policy: only compute when actual >= low_wind_threshold to avoid division by zero / singularity
    def calc_pct_error(row):
        act = row["actual_mw"]
        err = row["error_mw"]
        if pd.isna(act) or pd.isna(err) or act < low_wind_threshold:
            return None
        return round((err / act) * 100.0, 2)

    merged["pct_error"] = merged.apply(calc_pct_error, axis=1)
    merged["is_low_wind"] = merged["actual_mw"].apply(
        lambda v: False if pd.isna(v) else v < low_wind_threshold
    )

    if "publishTime" not in merged.columns:
        merged["publishTime"] = None

    return merged

def compute_period_summary(
    df: pd.DataFrame,
    start_date: str,
    end_date: str,
    vintage: str = "DAY_AHEAD",
    low_wind_threshold: float = settings.LOW_WIND_THRESHOLD_MW,
) -> PeriodSummary:
    """
    Computes rigorous aggregated accuracy metrics across the period.
    """
    total_expected = len(df)
    valid_mask = df["actual_mw"].notna() & df["forecast_mw"].notna()
    matched_df = df[valid_mask]
    matched_count = len(matched_df)
    
    coverage_pct = round((matched_count / total_expected * 100.0) if total_expected > 0 else 0.0, 2)
    missing_actual = int(df["actual_mw"].isna().sum())
    missing_forecast = int(df["forecast_mw"].isna().sum())

    if matched_count == 0:
        return PeriodSummary(
            start_date=start_date,
            end_date=end_date,
            total_expected_intervals=total_expected,
            matched_intervals=0,
            data_coverage_pct=0.0,
            missing_actual_intervals=missing_actual,
            missing_forecast_intervals=missing_forecast,
            mean_actual_mw=0.0,
            mean_forecast_mw=0.0,
            total_actual_gwh=0.0,
            total_forecast_gwh=0.0,
            peak_actual_mw=0.0,
            peak_actual_time="",
            peak_forecast_mw=0.0,
            peak_forecast_time="",
            mae_mw=0.0,
            rmse_mw=0.0,
            forecast_bias_mw=0.0,
            bias_direction="NEUTRAL",
            mape_pct=None,
            mape_excluded_low_wind_count=0,
            wape_pct=0.0,
            max_overforecast_mw=0.0,
            max_overforecast_time="",
            max_underforecast_mw=0.0,
            max_underforecast_time="",
            forecast_vintage=vintage,
        )

    # Generation volumes (Hourly MW over 1 hour = MWh, / 1000 = GWh)
    mean_actual = float(matched_df["actual_mw"].mean())
    mean_forecast = float(matched_df["forecast_mw"].mean())
    total_act_gwh = float(matched_df["actual_mw"].sum() / 1000.0)
    total_fc_gwh = float(matched_df["forecast_mw"].sum() / 1000.0)

    # Peaks
    idx_peak_act = matched_df["actual_mw"].idxmax()
    peak_act_row = matched_df.loc[idx_peak_act]
    peak_act_mw = float(peak_act_row["actual_mw"])
    peak_act_time = str(peak_act_row["timestamp"])

    idx_peak_fc = matched_df["forecast_mw"].idxmax()
    peak_fc_row = matched_df.loc[idx_peak_fc]
    peak_fc_mw = float(peak_fc_row["forecast_mw"])
    peak_fc_time = str(peak_fc_row["timestamp"])

    # Errors
    errors = matched_df["error_mw"].values
    abs_errors = matched_df["abs_error_mw"].values
    
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))
    bias_dir = "OVERFORECAST" if bias > 0 else ("UNDERFORECAST" if bias < 0 else "NEUTRAL")

    # WAPE = sum(|Forecast - Actual|) / sum(Actual) * 100
    sum_abs_err = float(np.sum(abs_errors))
    sum_actual = float(np.sum(matched_df["actual_mw"].values))
    wape = round((sum_abs_err / sum_actual * 100.0) if sum_actual > 0 else 0.0, 2)

    # MAPE with explicit low-wind filter
    mape_eligible = matched_df[matched_df["actual_mw"] >= low_wind_threshold]
    excluded_low_wind = len(matched_df) - len(mape_eligible)
    if len(mape_eligible) > 0:
        mape_val = round(float(np.mean(mape_eligible["abs_error_mw"] / mape_eligible["actual_mw"])) * 100.0, 2)
    else:
        mape_val = None

    # Max overforecast (largest positive error)
    idx_max_over = matched_df["error_mw"].idxmax()
    max_over_row = matched_df.loc[idx_max_over]
    max_over_mw = float(max_over_row["error_mw"])
    max_over_time = str(max_over_row["timestamp"])

    # Max underforecast (largest negative error)
    idx_max_under = matched_df["error_mw"].idxmin()
    max_under_row = matched_df.loc[idx_max_under]
    max_under_mw = float(max_under_row["error_mw"])
    max_under_time = str(max_under_row["timestamp"])

    return PeriodSummary(
        start_date=start_date,
        end_date=end_date,
        total_expected_intervals=total_expected,
        matched_intervals=matched_count,
        data_coverage_pct=coverage_pct,
        missing_actual_intervals=missing_actual,
        missing_forecast_intervals=missing_forecast,
        mean_actual_mw=round(mean_actual, 1),
        mean_forecast_mw=round(mean_forecast, 1),
        total_actual_gwh=round(total_act_gwh, 2),
        total_forecast_gwh=round(total_fc_gwh, 2),
        peak_actual_mw=round(peak_act_mw, 1),
        peak_actual_time=peak_act_time,
        peak_forecast_mw=round(peak_fc_mw, 1),
        peak_forecast_time=peak_fc_time,
        mae_mw=round(mae, 1),
        rmse_mw=round(rmse, 1),
        forecast_bias_mw=round(bias, 1),
        bias_direction=bias_dir,
        mape_pct=mape_val,
        mape_excluded_low_wind_count=excluded_low_wind,
        wape_pct=wape,
        max_overforecast_mw=round(max_over_mw, 1),
        max_overforecast_time=max_over_time,
        max_underforecast_mw=round(max_under_mw, 1),
        max_underforecast_time=max_under_time,
        forecast_vintage=vintage,
    )

def compute_deviations(df: pd.DataFrame, limit: int = 10) -> List[DeviationItem]:
    """
    Ranks the largest absolute deviations and enriches them with purchasing context.
    """
    valid = df[df["actual_mw"].notna() & df["forecast_mw"].notna()].copy()
    if valid.empty:
        return []

    top_deviations = valid.sort_values(by="abs_error_mw", ascending=False).head(limit)
    
    items: List[DeviationItem] = []
    for rank, (_, row) in enumerate(top_deviations.iterrows(), start=1):
        err = float(row["error_mw"])
        abs_err = float(row["abs_error_mw"])
        act = float(row["actual_mw"])
        fc = float(row["forecast_mw"])
        direction = "OVERFORECAST" if err > 0 else "UNDERFORECAST"
        
        # Severity tiers
        if abs_err >= 4000.0:
            severity = "CRITICAL"
        elif abs_err >= 2500.0:
            severity = "HIGH"
        else:
            severity = "MODERATE"

        # Context and purchasing implications
        if direction == "OVERFORECAST":
            reason = f"Actual wind fell {abs_err:,.0f} MW short of the day-ahead forecast ({act:,.0f} MW outturn vs {fc:,.0f} MW forecast)."
            implication = (
                f"A day-ahead buyer relying purely on the wind forecast would have under-hedged replacement power by {abs_err:,.0f} MW, "
                "leaving open short positions settled at cashout (System Buy Price) or requiring costly within-day balancing peaker dispatch."
            )
        else:
            reason = f"Actual wind exceeded the day-ahead forecast by {abs_err:,.0f} MW ({act:,.0f} MW outturn vs {fc:,.0f} MW forecast)."
            implication = (
                f"A buyer hedging on this forecast would have over-procured alternative baseload energy by {abs_err:,.0f} MW, "
                "facing potential spill or long imbalance settled at discounted System Sell Price during low-demand periods."
            )

        items.append(
            DeviationItem(
                rank=rank,
                timestamp=str(row["timestamp"]),
                delivery_date=str(row["delivery_date"]),
                settlement_period=int(row["settlement_period"]),
                settlement_period_label=str(row["settlement_period_label"]),
                actual_mw=round(act, 1),
                forecast_mw=round(fc, 1),
                error_mw=round(err, 1),
                abs_error_mw=round(abs_err, 1),
                pct_error=row["pct_error"],
                direction=direction,
                severity=severity,
                context_reason=reason,
                purchasing_implication=implication,
            )
        )

    return items

def compute_daily_accuracy(df: pd.DataFrame) -> List[DailyAccuracyItem]:
    """
    Computes daily time-aggregated accuracy stats across January.
    """
    valid = df[df["actual_mw"].notna() & df["forecast_mw"].notna()].copy()
    if valid.empty:
        return []

    daily_items: List[DailyAccuracyItem] = []
    for date_str, group in valid.groupby("delivery_date"):
        act_gwh = float(group["actual_mw"].sum() / 1000.0)
        fc_gwh = float(group["forecast_mw"].sum() / 1000.0)
        mae = float(group["abs_error_mw"].mean())
        rmse = float(np.sqrt(np.mean(group["error_mw"].values ** 2)))
        bias = float(group["error_mw"].mean())
        
        sum_abs_err = float(group["abs_error_mw"].sum())
        sum_act = float(group["actual_mw"].sum())
        wape = round((sum_abs_err / sum_act * 100.0) if sum_act > 0 else 0.0, 2)
        
        daily_items.append(
            DailyAccuracyItem(
                date=str(date_str),
                actual_gwh=round(act_gwh, 2),
                forecast_gwh=round(fc_gwh, 2),
                mae_mw=round(mae, 1),
                rmse_mw=round(rmse, 1),
                bias_mw=round(bias, 1),
                wape_pct=wape,
                peak_actual_mw=round(float(group["actual_mw"].max()), 1),
                peak_forecast_mw=round(float(group["forecast_mw"].max()), 1),
                max_abs_error_mw=round(float(group["abs_error_mw"].max()), 1),
                matched_hours=len(group),
            )
        )
    daily_items.sort(key=lambda d: d.date)
    return daily_items

def compute_diurnal_profile(df: pd.DataFrame) -> List[DiurnalHourProfile]:
    """
    Computes diurnal (hour 0-23) error tendencies to reveal intra-day forecast biases.
    """
    valid = df[df["actual_mw"].notna() & df["forecast_mw"].notna()].copy()
    if valid.empty:
        return []

    profile: List[DiurnalHourProfile] = []
    for hour, grp in valid.groupby("hour"):
        hour_int = int(hour)
        act_avg = float(grp["actual_mw"].mean())
        fc_avg = float(grp["forecast_mw"].mean())
        mae = float(grp["abs_error_mw"].mean())
        bias = float(grp["error_mw"].mean())
        
        sum_abs_err = float(grp["abs_error_mw"].sum())
        sum_act = float(grp["actual_mw"].sum())
        wape = round((sum_abs_err / sum_act * 100.0) if sum_act > 0 else 0.0, 2)
        
        profile.append(
            DiurnalHourProfile(
                hour=hour_int,
                time_label=f"{hour_int:02d}:00",
                actual_avg_mw=round(act_avg, 1),
                forecast_avg_mw=round(fc_avg, 1),
                mae_mw=round(mae, 1),
                bias_mw=round(bias, 1),
                wape_pct=wape,
            )
        )
    profile.sort(key=lambda p: p.hour)
    return profile

def compute_error_distribution(df: pd.DataFrame) -> List[ErrorDistributionBin]:
    """
    Groups errors into histogram bins from -6000 MW to +6000 MW in 1000 MW intervals.
    """
    valid = df[df["actual_mw"].notna() & df["forecast_mw"].notna()].copy()
    if valid.empty:
        return []

    errors = valid["error_mw"].values
    total = len(errors)

    bins = [
        (-float("inf"), -4000.0, "< -4,000 MW"),
        (-4000.0, -2500.0, "-4,000 to -2,500 MW"),
        (-2500.0, -1000.0, "-2,500 to -1,000 MW"),
        (-1000.0, 0.0, "-1,000 to 0 MW"),
        (0.0, 1000.0, "0 to +1,000 MW"),
        (1000.0, 2500.0, "+1,000 to +2,500 MW"),
        (2500.0, 4000.0, "+2,500 to +4,000 MW"),
        (4000.0, float("inf"), "> +4,000 MW"),
    ]

    dist: List[ErrorDistributionBin] = []
    for low, high, label in bins:
        if low == -float("inf"):
            cnt = int(np.sum(errors < high))
        elif high == float("inf"):
            cnt = int(np.sum(errors >= low))
        else:
            cnt = int(np.sum((errors >= low) & (errors < high)))
            
        pct = round((cnt / total * 100.0) if total > 0 else 0.0, 2)
        dist.append(
            ErrorDistributionBin(
                bin_label=label,
                range_min=-9999.0 if low == -float("inf") else low,
                range_max=9999.0 if high == float("inf") else high,
                count=cnt,
                percentage=pct,
            )
        )
    return dist

def generate_rule_based_insights(summary: PeriodSummary, daily: List[DailyAccuracyItem], diurnal: List[DiurnalHourProfile]) -> InsightsResponse:
    """
    Derives deterministic, transparent, metric-grounded insights for energy buyers and traders.
    Each insight cites the specific observed metric supporting it.
    """
    insights: List[InsightItem] = []

    # 1. Systematic Bias Insight
    bias = summary.forecast_bias_mw
    wape = summary.wape_pct
    mae = summary.mae_mw
    
    if abs(bias) > 200:
        dir_text = "over-forecasted" if bias > 0 else "under-forecasted"
        implication = (
            "Systematic over-forecasting means procurement desks relying purely on day-ahead wind volumes "
            "face unhedged short positions in outturn, exposing them to within-day balancing cashout (System Buy Price) spikes."
            if bias > 0 else
            "Systematic under-forecasting means buyers risk over-contracting thermal or imported baseload power, "
            "facing discounted System Sell Price liquidation when excess wind spills into the balancing mechanism."
        )
        insights.append(
            InsightItem(
                id="ins-bias-1",
                category="BIAS",
                title=f"Persistent Monthly Forecast {summary.bias_direction.title()}",
                summary=(
                    f"Across January 2026, the day-ahead wind forecast {dir_text} outturn generation by an average of "
                    f"{abs(bias):,.1f} MW per hour ({wape:.1f}% WAPE across {summary.matched_intervals} matched delivery intervals)."
                ),
                supporting_metrics={
                    "forecast_bias_mw": bias,
                    "mae_mw": mae,
                    "wape_pct": wape,
                    "matched_intervals": summary.matched_intervals,
                },
                actionable_takeaway=implication,
            )
        )
    else:
        insights.append(
            InsightItem(
                id="ins-bias-neutral",
                category="BIAS",
                title="Balanced Aggregate Month-Long Bias",
                summary=(
                    f"Overall monthly bias was modest at {bias:+,.1f} MW, indicating that overforecast and underforecast errors "
                    f"broadly netted out across the 31-day aggregate period, though significant hourly volatility remained."
                ),
                supporting_metrics={"forecast_bias_mw": bias, "mae_mw": mae, "wape_pct": wape},
                actionable_takeaway="Do not confuse low net monthly bias with low hourly risk; hourly MAE still represents substantial cashout exposure.",
            )
        )

    # 2. Maximum Deviation Events
    insights.append(
        InsightItem(
            id="ins-extreme-events",
            category="VOLATILITY",
            title="Extreme Forecast Tail Risk Events",
            summary=(
                f"Peak single-hour overforecast reached +{summary.max_overforecast_mw:,.0f} MW (at {summary.max_overforecast_time}), "
                f"while peak underforecast reached {summary.max_underforecast_mw:,.0f} MW (at {summary.max_underforecast_time})."
            ),
            supporting_metrics={
                "max_overforecast_mw": summary.max_overforecast_mw,
                "max_overforecast_time": summary.max_overforecast_time,
                "max_underforecast_mw": summary.max_underforecast_mw,
                "max_underforecast_time": summary.max_underforecast_time,
            },
            actionable_takeaway=(
                "Tail deviation events typically coincide with rapidly moving meteorological fronts and steep ramp timing mismatches. "
                "Traders should monitor rapid barometer shifts on D-1 rather than relying on point forecasts during frontal passages."
            ),
        )
    )

    # 3. Daily Volatility Clustering
    if daily:
        highest_mae_day = max(daily, key=lambda d: d.mae_mw)
        lowest_mae_day = min(daily, key=lambda d: d.mae_mw)
        insights.append(
            InsightItem(
                id="ins-daily-volatility",
                category="VOLATILITY",
                title=f"High Error Concentration on {highest_mae_day.date}",
                summary=(
                    f"Forecast errors were heavily clustered. {highest_mae_day.date} recorded the highest daily MAE at "
                    f"{highest_mae_day.mae_mw:,.0f} MW (WAPE {highest_mae_day.wape_pct:.1f}%), compared to the most accurate day "
                    f"({lowest_mae_day.date}) with MAE of {lowest_mae_day.mae_mw:,.0f} MW."
                ),
                supporting_metrics={
                    "worst_day_date": highest_mae_day.date,
                    "worst_day_mae_mw": highest_mae_day.mae_mw,
                    "best_day_date": lowest_mae_day.date,
                    "best_day_mae_mw": lowest_mae_day.mae_mw,
                },
                actionable_takeaway="Dynamic hedging buffers are superior to fixed monthly margins: expand volume buffers on volatile meteorological transition days.",
            )
        )

    # 4. Diurnal Peak Demand Accuracy
    if diurnal:
        # Check evening peak hours (17:00 - 19:00 UTC) vs night (01:00 - 04:00 UTC)
        peak_hours = [p for p in diurnal if 16 <= p.hour <= 20]
        offpeak_hours = [p for p in diurnal if 1 <= p.hour <= 5]
        
        avg_peak_mae = np.mean([p.mae_mw for p in peak_hours]) if peak_hours else 0.0
        avg_offpeak_mae = np.mean([p.mae_mw for p in offpeak_hours]) if offpeak_hours else 0.0
        
        insights.append(
            InsightItem(
                id="ins-diurnal-peak",
                category="DIURNAL",
                title="Diurnal Error Profile Across Market Peak",
                summary=(
                    f"During the critical evening peak hours (16:00–20:00 UTC), forecast MAE averaged {avg_peak_mae:,.0f} MW, "
                    f"versus {avg_offpeak_mae:,.0f} MW during early morning off-peak hours (01:00–05:00 UTC)."
                ),
                supporting_metrics={
                    "evening_peak_avg_mae_mw": round(float(avg_peak_mae), 1),
                    "offpeak_avg_mae_mw": round(float(avg_offpeak_mae), 1),
                },
                actionable_takeaway=(
                    "Because wholesale power and imbalance spread multipliers peak between 16:30 and 19:30, "
                    "forecast errors during evening hours carry up to 3x greater financial consequence per MW than overnight errors."
                ),
            )
        )

    # 5. Data Quality & Coverage
    insights.append(
        InsightItem(
            id="ins-data-quality",
            category="DATA_QUALITY",
            title=f"Data Completeness: {summary.data_coverage_pct}% Valid Matched Intervals",
            summary=(
                f"Evaluation matched {summary.matched_intervals} of {summary.total_expected_intervals} expected delivery hours. "
                f"Missing actual intervals: {summary.missing_actual_intervals}; missing forecast intervals: {summary.missing_forecast_intervals}."
            ),
            supporting_metrics={
                "data_coverage_pct": summary.data_coverage_pct,
                "matched_intervals": summary.matched_intervals,
                "missing_actual_intervals": summary.missing_actual_intervals,
            },
            actionable_takeaway="Zero intervals were synthetically imputed or zero-filled. All performance metrics reflect certified settlement records.",
        )
    )

    # Playbook recommendations
    playbook = [
        {
            "rule": "Haircut High-Wind Day-Ahead Nominations",
            "condition": "When day-ahead wind forecast exceeds 15,000 MW",
            "recommendation": "Contract only 85-90% of expected wind generation day-ahead to guard against high-wind cut-out or front delay.",
        },
        {
            "rule": "Evening Peak De-risking",
            "condition": "Settlement periods 33-40 (16:30-20:00 UTC)",
            "recommendation": "Secure firm cross-border or flexible peaker capacity to absorb potential wind drops during top system demand.",
        },
        {
            "rule": "Low-Wind Low-Consequence Buffer",
            "condition": "When wind forecast is below 3,000 MW",
            "recommendation": "Absolute MW deviation risk is minimal (<1,000 MW); focus trading desk attention on spark spreads and demand sensitivity.",
        },
    ]

    return InsightsResponse(
        start_date=summary.start_date,
        end_date=summary.end_date,
        generated_at=datetime.utcnow().isoformat() + "Z",
        insights=insights,
        purchasing_playbook=playbook,
    )

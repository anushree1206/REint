import logging
from typing import List, Dict, Any, Optional
import pandas as pd

from backend.app.core.config import settings
from backend.app.clients.elexon import elexon_client
from backend.app.analytics.metrics import (
    align_actual_and_forecast,
    compute_period_summary,
    compute_deviations,
    compute_daily_accuracy,
    compute_diurnal_profile,
    compute_error_distribution,
    generate_rule_based_insights,
)
from backend.app.models.schemas import (
    IntervalRecord,
    PeriodSummary,
    DeviationItem,
    ForecastAccuracyResponse,
    InsightsResponse,
)

logger = logging.getLogger(__name__)

class WindService:
    def __init__(self):
        self.client = elexon_client

    async def get_aligned_dataframe(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        vintage: str = "DAY_AHEAD",
    ) -> pd.DataFrame:
        """
        Fetches raw actuals and forecasts from Elexon client and executes interval alignment.
        """
        actual_raw = await self.client.get_actual_wind_generation(start_date, end_date)
        forecast_raw = await self.client.get_wind_forecast(start_date, end_date, vintage=vintage)
        
        df = align_actual_and_forecast(
            actual_records=actual_raw,
            forecast_records=forecast_raw,
            start_date=start_date,
            end_date=end_date,
            vintage=vintage,
            low_wind_threshold=settings.LOW_WIND_THRESHOLD_MW,
        )
        return df

    async def get_summary(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        vintage: str = "DAY_AHEAD",
    ) -> PeriodSummary:
        df = await self.get_aligned_dataframe(start_date, end_date, vintage)
        return compute_period_summary(df, start_date, end_date, vintage)

    async def get_timeseries(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        date: Optional[str] = None,
        vintage: str = "DAY_AHEAD",
    ) -> List[IntervalRecord]:
        s_date = date or start_date or settings.DEFAULT_START_DATE
        e_date = date or end_date or settings.DEFAULT_END_DATE
        
        df = await self.get_aligned_dataframe(s_date, e_date, vintage)
        
        records: List[IntervalRecord] = []
        for _, row in df.iterrows():
            act = None if pd.isna(row["actual_mw"]) else round(float(row["actual_mw"]), 1)
            fc = None if pd.isna(row["forecast_mw"]) else round(float(row["forecast_mw"]), 1)
            err = None if pd.isna(row["error_mw"]) else round(float(row["error_mw"]), 1)
            abs_err = None if pd.isna(row["abs_error_mw"]) else round(float(row["abs_error_mw"]), 1)
            
            records.append(
                IntervalRecord(
                    timestamp=str(row["timestamp"]),
                    delivery_date=str(row["delivery_date"]),
                    hour=int(row["hour"]),
                    settlement_period=int(row["settlement_period"]),
                    settlement_period_label=str(row["settlement_period_label"]),
                    actual_mw=act,
                    forecast_mw=fc,
                    error_mw=err,
                    abs_error_mw=abs_err,
                    pct_error=row["pct_error"],
                    forecast_vintage=vintage,
                    publish_time=str(row["publishTime"]) if row["publishTime"] is not None else None,
                    is_low_wind=bool(row["is_low_wind"]),
                )
            )
        return records

    async def get_forecast_accuracy(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        vintage: str = "DAY_AHEAD",
    ) -> ForecastAccuracyResponse:
        df = await self.get_aligned_dataframe(start_date, end_date, vintage)
        summary = compute_period_summary(df, start_date, end_date, vintage)
        daily = compute_daily_accuracy(df)
        diurnal = compute_diurnal_profile(df)
        dist = compute_error_distribution(df)
        
        return ForecastAccuracyResponse(
            summary=summary,
            daily_accuracy=daily,
            diurnal_profile=diurnal,
            error_distribution=dist,
        )

    async def get_deviations(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        limit: int = 10,
        vintage: str = "DAY_AHEAD",
    ) -> List[DeviationItem]:
        df = await self.get_aligned_dataframe(start_date, end_date, vintage)
        return compute_deviations(df, limit=limit)

    async def get_insights(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        vintage: str = "DAY_AHEAD",
    ) -> InsightsResponse:
        df = await self.get_aligned_dataframe(start_date, end_date, vintage)
        summary = compute_period_summary(df, start_date, end_date, vintage)
        daily = compute_daily_accuracy(df)
        diurnal = compute_diurnal_profile(df)
        return generate_rule_based_insights(summary, daily, diurnal)

wind_service = WindService()

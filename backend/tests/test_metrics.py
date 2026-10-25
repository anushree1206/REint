import pytest
import numpy as np
import pandas as pd

from backend.app.analytics.metrics import (
    align_actual_and_forecast,
    compute_period_summary,
    compute_deviations,
    compute_daily_accuracy,
    compute_diurnal_profile,
    compute_error_distribution,
    generate_rule_based_insights,
)

def test_interval_error_sign_convention():
    """
    Error = Forecast - Actual
    Positive error (>0) must indicate Overforecast.
    Negative error (<0) must indicate Underforecast.
    """
    actuals = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 1000},
        {"settlementDate": "2026-01-01", "settlementPeriod": 2, "generation": 1000},
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 2000},
        {"settlementDate": "2026-01-01", "settlementPeriod": 4, "generation": 2000},
    ]
    forecasts = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 1500},  # Overforecast by 500
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 1200},  # Underforecast by 800
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-01", end_date="2026-01-01")
    
    row_sp1 = df[df["settlement_period"] == 1].iloc[0]
    assert row_sp1["actual_mw"] == 1000.0
    assert row_sp1["forecast_mw"] == 1500.0
    assert row_sp1["error_mw"] == 500.0
    assert row_sp1["abs_error_mw"] == 500.0
    assert row_sp1["pct_error"] == 50.0  # (1500 - 1000) / 1000 * 100

    row_sp3 = df[df["settlement_period"] == 3].iloc[0]
    assert row_sp3["actual_mw"] == 2000.0
    assert row_sp3["forecast_mw"] == 1200.0
    assert row_sp3["error_mw"] == -800.0
    assert row_sp3["abs_error_mw"] == 800.0
    assert row_sp3["pct_error"] == -40.0

def test_zero_and_near_zero_mape_policy():
    """
    MAPE must NOT produce infinite or astronomical values on zero/near-zero generation.
    Intervals where Actual < 100MW must be excluded from MAPE calculation.
    """
    actuals = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 0.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 2, "generation": 10.0},  # Avg = 5MW (< 100MW)
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 1000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 4, "generation": 1000.0},  # Avg = 1000MW
    ]
    forecasts = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 200.0},  # Forecast when wind was near zero
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 1100.0}, # Forecast err 100MW
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-01", end_date="2026-01-01")
    
    # Check row 1 pct_error is NaN due to low wind threshold
    row_sp1 = df[df["settlement_period"] == 1].iloc[0]
    assert bool(row_sp1["is_low_wind"]) is True
    assert pd.isna(row_sp1["pct_error"])

    summary = compute_period_summary(df, start_date="2026-01-01", end_date="2026-01-01")
    assert summary.mape_excluded_low_wind_count >= 1
    assert summary.mape_pct is not None
    assert summary.mape_pct == 10.0  # (100 / 1000) * 100

def test_mae_rmse_wape_mathematical_precision():
    """
    Verifies that MAE, RMSE, and WAPE match hand-calculated values.
    """
    actuals = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 1000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 2, "generation": 1000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 3000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 4, "generation": 3000.0},
    ]
    forecasts = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 1200.0}, # error = +200
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 2600.0}, # error = -400
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-01", end_date="2026-01-01")
    summary = compute_period_summary(df, start_date="2026-01-01", end_date="2026-01-01")

    # MAE = (|200| + |-400|) / 2 = 300.0
    assert summary.mae_mw == 300.0
    
    # RMSE = sqrt((200^2 + (-400)^2) / 2) = sqrt((40000 + 160000) / 2) = sqrt(100000) ≈ 316.2
    assert pytest.approx(summary.rmse_mw, 0.1) == 316.2

    # Bias = (200 - 400) / 2 = -100.0
    assert summary.forecast_bias_mw == -100.0
    assert summary.bias_direction == "UNDERFORECAST"

    # WAPE = sum(|error|) / sum(actual) * 100 = (200 + 400) / (1000 + 3000) * 100 = 600 / 4000 * 100 = 15.0%
    assert summary.wape_pct == 15.0

def test_missing_data_coverage_preserved():
    """
    Missing actual records must NOT be replaced with 0; data coverage must accurately report missing count.
    """
    actuals = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 2000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 2, "generation": 2000.0},
        # SP 3 is missing entirely!
    ]
    forecasts = [
        {"settlementDate": "2026-01-01", "settlementPeriod": 1, "generation": 2000.0},
        {"settlementDate": "2026-01-01", "settlementPeriod": 3, "generation": 2500.0},
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-01", end_date="2026-01-01")
    
    row_sp3 = df[df["settlement_period"] == 3].iloc[0]
    assert pd.isna(row_sp3["actual_mw"])
    assert row_sp3["forecast_mw"] == 2500.0
    assert pd.isna(row_sp3["error_mw"])

    summary = compute_period_summary(df, start_date="2026-01-01", end_date="2026-01-01")
    assert summary.missing_actual_intervals >= 1
    assert summary.matched_intervals == 1

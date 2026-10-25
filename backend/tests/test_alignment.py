import pytest
import pandas as pd
from backend.app.analytics.metrics import align_actual_and_forecast, compute_period_summary

def test_odd_even_sp_aggregation():
    """
    Settlement Period 1 (00:00-00:30) and 2 (00:30-01:00) must average into 00:00 hourly actual.
    """
    actuals = [
        {"settlementDate": "2026-01-05", "settlementPeriod": 1, "generation": 12000.0},
        {"settlementDate": "2026-01-05", "settlementPeriod": 2, "generation": 14000.0},
    ]
    forecasts = [
        {"settlementDate": "2026-01-05", "settlementPeriod": 1, "generation": 13500.0},
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-05", end_date="2026-01-05")
    
    hour_0 = df[df["hour"] == 0].iloc[0]
    # (12000 + 14000) / 2 = 13000
    assert hour_0["actual_mw"] == 13000.0
    assert hour_0["forecast_mw"] == 13500.0
    assert hour_0["error_mw"] == 500.0
    assert hour_0["abs_error_mw"] == 500.0

def test_single_sp_available_in_hour():
    """
    If one half-hour is present and one missing, actual reflects available data without crash.
    """
    actuals = [
        {"settlementDate": "2026-01-10", "settlementPeriod": 1, "generation": 8500.0},
        # SP 2 missing
    ]
    forecasts = [
        {"settlementDate": "2026-01-10", "settlementPeriod": 1, "generation": 9000.0},
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-10", end_date="2026-01-10")
    
    hour_0 = df[df["hour"] == 0].iloc[0]
    assert hour_0["actual_mw"] == 8500.0
    assert hour_0["forecast_mw"] == 9000.0
    assert hour_0["error_mw"] == 500.0

def test_duplicate_handling():
    """
    Duplicates in source forecast must be cleanly deduplicated without distorting counts.
    """
    actuals = [
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "generation": 5000.0},
        {"settlementDate": "2026-01-15", "settlementPeriod": 2, "generation": 5000.0},
    ]
    forecasts = [
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "generation": 5200.0, "publishTime": "2026-01-14T15:30:00Z"},
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "generation": 5200.0, "publishTime": "2026-01-14T15:30:00Z"},
    ]
    df = align_actual_and_forecast(actuals, forecasts, start_date="2026-01-15", end_date="2026-01-15")
    # Only 24 rows in a single day
    assert len(df) == 24
    hour_0 = df[df["hour"] == 0].iloc[0]
    assert hour_0["forecast_mw"] == 5200.0

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "WindLens Decision Support Backend"
    version: str
    cache_ready: bool
    cached_records_count: int
    upstream_elexon_reachable: bool
    analysis_period: str = "2026-01-01 to 2026-01-31"

class IntervalRecord(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 UTC delivery timestamp (hour start)")
    delivery_date: str = Field(..., description="YYYY-MM-DD")
    hour: int = Field(..., description="Hour of day 0-23")
    settlement_period: int = Field(..., description="Elexon settlement period (1, 3, ..., 47)")
    settlement_period_label: str = Field(..., description="e.g. SP 1-2 (00:00-01:00)")
    actual_mw: Optional[float] = Field(None, description="Actual hourly mean wind generation in MW")
    forecast_mw: Optional[float] = Field(None, description="Forecast wind generation in MW")
    error_mw: Optional[float] = Field(None, description="Forecast minus Actual in MW (+ = overforecast, - = underforecast)")
    abs_error_mw: Optional[float] = Field(None, description="Absolute error |Forecast - Actual| in MW")
    pct_error: Optional[float] = Field(None, description="Percentage error (Forecast - Actual)/Actual * 100% (null if actual < 100MW)")
    forecast_vintage: str = Field("DAY_AHEAD", description="Vintage: DAY_AHEAD, LATEST, or EARLIEST")
    publish_time: Optional[str] = Field(None, description="Forecast issue/publish timestamp")
    is_low_wind: bool = Field(False, description="True if actual generation < threshold (100 MW)")

class PeriodSummary(BaseModel):
    start_date: str
    end_date: str
    total_expected_intervals: int
    matched_intervals: int
    data_coverage_pct: float
    missing_actual_intervals: int
    missing_forecast_intervals: int
    
    # Generation volume stats
    mean_actual_mw: float
    mean_forecast_mw: float
    total_actual_gwh: float
    total_forecast_gwh: float
    peak_actual_mw: float
    peak_actual_time: str
    peak_forecast_mw: float
    peak_forecast_time: str
    
    # Error metrics
    mae_mw: float
    rmse_mw: float
    forecast_bias_mw: float
    bias_direction: str  # OVERFORECAST or UNDERFORECAST
    mape_pct: Optional[float]
    mape_excluded_low_wind_count: int
    wape_pct: float
    
    # Extremes
    max_overforecast_mw: float
    max_overforecast_time: str
    max_underforecast_mw: float
    max_underforecast_time: str
    forecast_vintage: str

class DeviationItem(BaseModel):
    rank: int
    timestamp: str
    delivery_date: str
    settlement_period: int
    settlement_period_label: str
    actual_mw: float
    forecast_mw: float
    error_mw: float
    abs_error_mw: float
    pct_error: Optional[float]
    direction: str  # OVERFORECAST | UNDERFORECAST
    severity: str   # CRITICAL | HIGH | MODERATE
    context_reason: str
    purchasing_implication: str

class DailyAccuracyItem(BaseModel):
    date: str
    actual_gwh: float
    forecast_gwh: float
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    wape_pct: float
    peak_actual_mw: float
    peak_forecast_mw: float
    max_abs_error_mw: float
    matched_hours: int

class DiurnalHourProfile(BaseModel):
    hour: int
    time_label: str
    actual_avg_mw: float
    forecast_avg_mw: float
    mae_mw: float
    bias_mw: float
    wape_pct: float

class ErrorDistributionBin(BaseModel):
    bin_label: str
    range_min: float
    range_max: float
    count: int
    percentage: float

class ForecastAccuracyResponse(BaseModel):
    summary: PeriodSummary
    daily_accuracy: List[DailyAccuracyItem]
    diurnal_profile: List[DiurnalHourProfile]
    error_distribution: List[ErrorDistributionBin]

class InsightItem(BaseModel):
    id: str
    category: str  # BIAS | VOLATILITY | DIURNAL | PURCHASING_RISK | DATA_QUALITY
    title: str
    summary: str
    supporting_metrics: Dict[str, Any]
    actionable_takeaway: str

class InsightsResponse(BaseModel):
    start_date: str
    end_date: str
    generated_at: str
    insights: List[InsightItem]
    purchasing_playbook: List[Dict[str, str]]

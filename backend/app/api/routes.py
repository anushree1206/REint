import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from backend.app.core.config import settings
from backend.app.services.wind_service import wind_service
from backend.app.clients.elexon import elexon_client
from backend.app.models.schemas import (
    HealthResponse,
    PeriodSummary,
    IntervalRecord,
    ForecastAccuracyResponse,
    DeviationItem,
    InsightsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Returns system health, cache status, and upstream Elexon API responsiveness.
    """
    upstream_ok = await elexon_client.check_health()
    cache_info = elexon_client.get_cache_summary()
    
    return HealthResponse(
        status="healthy" if upstream_ok or cache_info["is_populated"] else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        cache_ready=cache_info["is_populated"],
        cached_records_count=cache_info["file_count"],
        upstream_elexon_reachable=upstream_ok,
        analysis_period=f"{settings.DEFAULT_START_DATE} to {settings.DEFAULT_END_DATE}",
    )

@router.get("/summary", response_model=PeriodSummary, tags=["Analytics"])
async def get_summary(
    start_date: str = Query(settings.DEFAULT_START_DATE, description="Start date YYYY-MM-DD"),
    end_date: str = Query(settings.DEFAULT_END_DATE, description="End date YYYY-MM-DD"),
    vintage: str = Query("DAY_AHEAD", description="Forecast vintage: DAY_AHEAD, LATEST, or EARLIEST"),
):
    """
    Returns high-level KPI metrics (generation, forecast, MAE, RMSE, WAPE, Bias, Coverage).
    """
    try:
        return await wind_service.get_summary(start_date=start_date, end_date=end_date, vintage=vintage)
    except Exception as e:
        logger.exception("Failed to retrieve summary: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to calculate summary: {str(e)}")

@router.get("/timeseries", response_model=List[IntervalRecord], tags=["Analytics"])
async def get_timeseries(
    date: Optional[str] = Query(None, description="Specific date YYYY-MM-DD (e.g. 2026-01-15)"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    vintage: str = Query("DAY_AHEAD", description="Forecast vintage: DAY_AHEAD, LATEST, or EARLIEST"),
):
    """
    Returns granular interval records (actual MW, forecast MW, error MW, percentage deviation).
    """
    try:
        return await wind_service.get_timeseries(
            date=date,
            start_date=start_date,
            end_date=end_date,
            vintage=vintage,
        )
    except Exception as e:
        logger.exception("Failed to retrieve timeseries: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeseries data: {str(e)}")

@router.get("/forecast-accuracy", response_model=ForecastAccuracyResponse, tags=["Analytics"])
async def get_forecast_accuracy(
    start_date: str = Query(settings.DEFAULT_START_DATE, description="Start date YYYY-MM-DD"),
    end_date: str = Query(settings.DEFAULT_END_DATE, description="End date YYYY-MM-DD"),
    vintage: str = Query("DAY_AHEAD", description="Forecast vintage: DAY_AHEAD, LATEST, or EARLIEST"),
):
    """
    Returns detailed accuracy analysis: daily trends, diurnal hourly profile, error distribution histogram.
    """
    try:
        return await wind_service.get_forecast_accuracy(start_date=start_date, end_date=end_date, vintage=vintage)
    except Exception as e:
        logger.exception("Failed to retrieve forecast accuracy: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to calculate forecast accuracy: {str(e)}")

@router.get("/deviations", response_model=List[DeviationItem], tags=["Analytics"])
async def get_deviations(
    start_date: str = Query(settings.DEFAULT_START_DATE, description="Start date YYYY-MM-DD"),
    end_date: str = Query(settings.DEFAULT_END_DATE, description="End date YYYY-MM-DD"),
    limit: int = Query(10, ge=1, le=100, description="Number of deviations to return"),
    vintage: str = Query("DAY_AHEAD", description="Forecast vintage: DAY_AHEAD, LATEST, or EARLIEST"),
):
    """
    Returns ranked list of largest absolute forecast deviations with purchasing implications.
    """
    try:
        return await wind_service.get_deviations(start_date=start_date, end_date=end_date, limit=limit, vintage=vintage)
    except Exception as e:
        logger.exception("Failed to retrieve deviations: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to compute deviations: {str(e)}")

@router.get("/insights", response_model=InsightsResponse, tags=["Analytics"])
async def get_insights(
    start_date: str = Query(settings.DEFAULT_START_DATE, description="Start date YYYY-MM-DD"),
    end_date: str = Query(settings.DEFAULT_END_DATE, description="End date YYYY-MM-DD"),
    vintage: str = Query("DAY_AHEAD", description="Forecast vintage: DAY_AHEAD, LATEST, or EARLIEST"),
):
    """
    Returns rule-based, deterministic purchasing insights and playbook recommendations.
    """
    try:
        return await wind_service.get_insights(start_date=start_date, end_date=end_date, vintage=vintage)
    except Exception as e:
        logger.exception("Failed to retrieve insights: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "cache_ready" in data
    assert data["service"] == "WindLens"

def test_api_v1_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] in ["healthy", "degraded", "ok"]

def test_api_v1_summary_structure():
    response = client.get("/api/v1/summary?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert "mae_mw" in data
    assert "rmse_mw" in data
    assert "forecast_bias_mw" in data
    assert "wape_pct" in data
    assert "data_coverage_pct" in data
    assert data["start_date"] == "2026-01-01"
    assert data["end_date"] == "2026-01-02"

def test_api_v1_timeseries():
    response = client.get("/api/v1/timeseries?date=2026-01-01")
    assert response.status_code == 200
    records = response.json()
    assert isinstance(records, list)
    assert len(records) == 24  # 24 hourly intervals in 1 day
    first = records[0]
    assert "delivery_date" in first
    assert "settlement_period" in first
    assert "actual_mw" in first
    assert "forecast_mw" in first
    assert "error_mw" in first

def test_api_v1_deviations():
    response = client.get("/api/v1/deviations?start_date=2026-01-01&end_date=2026-01-02&limit=5")
    assert response.status_code == 200
    deviations = response.json()
    assert isinstance(deviations, list)
    assert len(deviations) <= 5
    if len(deviations) > 0:
        item = deviations[0]
        assert "rank" in item
        assert "direction" in item
        assert item["direction"] in ["OVERFORECAST", "UNDERFORECAST"]
        assert "purchasing_implication" in item
        assert "abs_error_mw" in item

def test_api_v1_insights():
    response = client.get("/api/v1/insights?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert "purchasing_playbook" in data
    assert len(data["insights"]) > 0
    first_insight = data["insights"][0]
    assert "category" in first_insight
    assert "actionable_takeaway" in first_insight

def test_api_v1_forecast_accuracy():
    response = client.get("/api/v1/forecast-accuracy?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "daily_accuracy" in data
    assert "diurnal_profile" in data
    assert "error_distribution" in data

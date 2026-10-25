import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    """
    Authoritative HTTP client for Elexon Insights Solution API.
    Handles data acquisition, 7-day chunking for FUELHH, and transparent local caching.
    """
    def __init__(self, base_url: Optional[str] = None, cache_dir: Optional[Path] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS
        self.headers = {
            "User-Agent": "WindLens-Analytics-Platform/1.0 (Energy Decision Support)",
            "Accept": "application/json",
        }

    def _cache_path(self, key: str) -> Path:
        clean_key = key.replace("/", "_").replace(":", "_").replace("?", "_").replace("&", "_")
        return self.cache_dir / f"{clean_key}.json"

    def _read_cache(self, key: str) -> Optional[List[Dict[str, Any]]]:
        p = self._cache_path(key)
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                    logger.info("Loaded %d records from cache for key: %s", len(payload), key)
                    return payload
            except Exception as e:
                logger.warning("Failed to read cache %s: %s", p, e)
        return None

    def _write_cache(self, key: str, data: List[Dict[str, Any]]) -> None:
        p = self._cache_path(key)
        try:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(data, f)
            logger.info("Wrote %d records to cache at %s", len(data), p)
        except Exception as e:
            logger.error("Failed to write cache %s: %s", p, e)

    async def check_health(self) -> bool:
        """Verifies upstream Elexon API responsiveness."""
        try:
            url = f"{self.base_url}/generation/outturn/current"
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                res = await client.get(url)
                return res.status_code == 200
        except Exception as e:
            logger.warning("Health check upstream ping failed: %s", e)
            return False

    async def fetch_fuelhh_wind_chunk(self, client: httpx.AsyncClient, s_from: str, s_to: str) -> List[Dict[str, Any]]:
        """Queries FUELHH for wind within a valid <= 7 day range."""
        url = f"{self.base_url}/datasets/FUELHH"
        params = {
            "settlementDateFrom": s_from,
            "settlementDateTo": s_to,
            "fuelType": "WIND",
        }
        res = await client.get(url, params=params)
        res.raise_for_status()
        data = res.json().get("data", [])
        return data

    async def get_actual_wind_generation(
        self, start_date: str = "2026-01-01", end_date: str = "2026-01-31"
    ) -> List[Dict[str, Any]]:
        """
        Retrieves actual wind generation outturn (FUELHH) across the date range.
        Uses 7-day chunking to satisfy Elexon date range constraints and caches results.
        """
        cache_key = f"actual_wind_fuelhh_{start_date}_{end_date}"
        cached = self._read_cache(cache_key)
        if cached is not None:
            return cached

        logger.info("Fetching actual wind generation from Elexon for %s to %s", start_date, end_date)
        dt_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        dt_end = datetime.strptime(end_date, "%Y-%m-%d").date()

        records: List[Dict[str, Any]] = []
        cur_start = dt_start

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            while cur_start <= dt_end:
                cur_end = min(cur_start + timedelta(days=6), dt_end)
                s_from = cur_start.strftime("%Y-%m-%d")
                s_to = cur_end.strftime("%Y-%m-%d")
                try:
                    chunk = await self.fetch_fuelhh_wind_chunk(client, s_from, s_to)
                    records.extend(chunk)
                except Exception as e:
                    logger.error("Error fetching FUELHH chunk %s to %s: %s", s_from, s_to, e)
                    raise RuntimeError(f"Failed to fetch FUELHH data from Elexon ({s_from} to {s_to}): {e}") from e
                cur_start = cur_end + timedelta(days=1)

        # Sort chronologically by startTime, settlementPeriod
        records.sort(key=lambda r: (r.get("startTime", ""), r.get("settlementPeriod", 0)))
        self._write_cache(cache_key, records)
        return records

    async def get_wind_forecast(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        vintage: str = "DAY_AHEAD",
    ) -> List[Dict[str, Any]]:
        """
        Retrieves wind forecast generation records.
        Supported vintages:
        - DAY_AHEAD: Uses the earliest/day-ahead run published before delivery (avoids look-ahead bias).
        - LATEST: Latest revised forecast issued prior to or at delivery.
        - EARLIEST: The first historical forecast published (48-66h prior).
        """
        v_upper = vintage.upper()
        cache_key = f"wind_forecast_{v_upper}_{start_date}_{end_date}"
        cached = self._read_cache(cache_key)
        if cached is not None:
            return cached

        from_iso = f"{start_date}T00:00:00Z"
        to_iso = f"{end_date}T23:59:59Z"

        if v_upper == "LATEST":
            endpoint = f"{self.base_url}/forecast/generation/wind/latest"
        else:
            # DAY_AHEAD and EARLIEST both use the earliest pre-delivery benchmark from Elexon's curated dataset
            endpoint = f"{self.base_url}/forecast/generation/wind/earliest"

        logger.info("Fetching %s wind forecast from Elexon: %s", v_upper, endpoint)
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            res = await client.get(endpoint, params={"from": from_iso, "to": to_iso})
            res.raise_for_status()
            data = res.json().get("data", [])

        # Sort chronologically
        data.sort(key=lambda r: r.get("startTime", ""))
        self._write_cache(cache_key, data)
        return data

    def get_cache_summary(self) -> Dict[str, Any]:
        """Provides transparency on cached files."""
        files = list(self.cache_dir.glob("*.json"))
        return {
            "cache_dir": str(self.cache_dir),
            "file_count": len(files),
            "files": [f.name for f in files],
            "is_populated": len(files) > 0,
        }

elexon_client = ElexonClient()

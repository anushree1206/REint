import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "WindLens"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Elexon API
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "25.0"))
    
    # Cache directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    CACHE_DIR: Path = BASE_DIR / "data" / "cache"
    
    # Analysis period defaults
    DEFAULT_START_DATE: str = "2026-01-01"
    DEFAULT_END_DATE: str = "2026-01-31"
    
    # Analytics parameters
    LOW_WIND_THRESHOLD_MW: float = 100.0  # Threshold for MAPE zero/near-zero handling
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ]

settings = Settings()
settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)

import logging
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.routes import router, health_check
from backend.app.services.wind_service import wind_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("windlens")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="WindLens UK Wind Energy Decision Support Platform - Backend API",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint at root as required
app.get("/health", tags=["Health"])(health_check)

# Mount API v1
app.include_router(router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("WindLens backend API starting up...")
    # Preload and cache January 2026 data in background so first user query is instant
    asyncio.create_task(warmup_cache())

async def warmup_cache():
    try:
        logger.info("Initiating January 2026 data cache warmup from Elexon...")
        await wind_service.get_summary("2026-01-01", "2026-01-31", vintage="DAY_AHEAD")
        logger.info("Data cache warmup complete!")
    except Exception as e:
        logger.warning("Cache warmup encountered error (will retry on user request): %s", e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8001, reload=False)

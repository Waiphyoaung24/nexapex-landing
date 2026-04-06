import logging

import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.vision.router import router as vision_router
from app.config import settings

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load YOLO26n model
    try:
        from ultralytics import YOLO
        logger.info("Loading YOLO model from: %s", settings.yolo_model_path)
        app.state.yolo_model = YOLO(settings.yolo_model_path)
        app.state.models_loaded = True
        logger.info("YOLO model loaded successfully")
    except Exception as exc:
        logger.error("Failed to load YOLO model: %s", exc)
        app.state.yolo_model = None
        app.state.models_loaded = False
    yield
    # Shutdown: cleanup
    if getattr(app.state, "yolo_model", None):
        del app.state.yolo_model


app = FastAPI(
    title="NexApex AI Studio API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(vision_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    mem = psutil.virtual_memory()
    return {
        "status": "ok",
        "models_loaded": app.state.models_loaded,
        "memory": {
            "total_mb": round(mem.total / 1024 / 1024),
            "used_mb": round(mem.used / 1024 / 1024),
            "percent": mem.percent,
        },
    }

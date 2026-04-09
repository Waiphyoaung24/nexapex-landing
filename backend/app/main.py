import logging

import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.chat.router import router as chat_router
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

    # Load LLM model for chat (optional — graceful skip if model not found)
    try:
        from pathlib import Path

        from llama_cpp import Llama

        llm_path = settings.llm_model_path
        if Path(llm_path).exists():
            logger.info("Loading LLM model from: %s", llm_path)
            app.state.llm = Llama(
                model_path=llm_path,
                n_ctx=settings.llm_context_length,
                n_gpu_layers=0,
                verbose=False,
            )
            logger.info("LLM model loaded successfully")
        else:
            app.state.llm = None
            logger.warning("LLM model not found at %s — chat disabled", llm_path)
    except Exception as exc:
        logger.error("Failed to load LLM: %s", exc)
        app.state.llm = None

    yield
    # Shutdown: cleanup
    if getattr(app.state, "yolo_model", None):
        del app.state.yolo_model
    if getattr(app.state, "llm", None):
        del app.state.llm


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

app.include_router(admin_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(vision_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    mem = psutil.virtual_memory()
    return {
        "status": "ok",
        "models_loaded": app.state.models_loaded,
        "llm_loaded": getattr(app.state, "llm", None) is not None,
        "memory": {
            "total_mb": round(mem.total / 1024 / 1024),
            "used_mb": round(mem.used / 1024 / 1024),
            "percent": mem.percent,
        },
    }

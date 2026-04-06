import psutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load AI models here later
    app.state.models_loaded = False
    yield
    # Shutdown: cleanup


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

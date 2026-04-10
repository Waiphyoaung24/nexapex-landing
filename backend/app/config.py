from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode

# Resolve paths relative to the backend directory (parent of app/)
_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # API
    api_prefix: str = "/api/v1"
    debug: bool = False
    allowed_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexapex_studio"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # AI Models (paths resolved relative to backend dir)
    yolo_model_path: str = str(_BACKEND_DIR / "models" / "yolo26n.pt")
    llm_model_path: str = str(_BACKEND_DIR / "models" / "nexapex-llm.gguf")
    llm_context_length: int = 4096

    # External APIs
    gemini_api_key: str = ""
    resend_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

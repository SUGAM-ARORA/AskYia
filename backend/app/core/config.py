from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, PostgresDsn
from typing import List, Optional


class Settings(BaseSettings):
    api_v1_str: str = "/api/v1"
    project_name: str = "Askyia"

    database_url: PostgresDsn = "postgresql+asyncpg://postgres:postgres@localhost:5432/workflow"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    serpapi_api_key: Optional[str] = None
    brave_api_key: Optional[str] = None

    chromadb_host: str = "localhost"
    chromadb_port: int = 8000

    backend_cors_origins: List[AnyHttpUrl] = []
    log_level: str = "info"

    class Config:
        env_file = ".env"
        case_sensitive = False
        str_strip_whitespace = True


def get_settings() -> Settings:
    return Settings()

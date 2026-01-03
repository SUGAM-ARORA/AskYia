"""
Application Configuration
Loads settings from environment variables
"""

from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_v1_str: str = "/api/v1"
    project_name: str = "Askyia"
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/workflow"
    
    # Security
    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # LLM API Keys
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # Web Search
    serpapi_api_key: Optional[str] = None
    
    # Vector Store (ChromaDB)
    chromadb_host: str = "localhost"
    chromadb_port: int = 8000
    
    # CORS
    backend_cors_origins: List[str] = ["*"]
    
    # ============== Logging Configuration ==============
    log_level: str = "INFO"
    log_format: str = "json"  # 'json' or 'text'
    log_dir: str = "logs"
    enable_file_logging: bool = True
    enable_console_logging: bool = True
    log_max_file_size: int = 10 * 1024 * 1024  # 10MB
    log_backup_count: int = 5
    
    # ============== NEW: Metrics Configuration ==============
    enable_metrics: bool = True
    metrics_port: int = 9090
    
    # ============== NEW: Redis (for real-time log streaming) ==============
    redis_url: str = "redis://localhost:6379"
    enable_redis: bool = False  # Set to True when Redis is available
    
    @field_validator("openai_api_key", "gemini_api_key", "serpapi_api_key", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        """Convert empty strings to None."""
        if v == "" or v == "None" or v == "null":
            return None
        return v
    
    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @field_validator("log_level", mode="before")
    @classmethod
    def validate_log_level(cls, v):
        """Validate and uppercase log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if isinstance(v, str):
            v = v.upper()
            if v not in valid_levels:
                return "INFO"
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Singleton settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
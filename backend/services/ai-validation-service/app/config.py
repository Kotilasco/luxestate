"""Configuration for AI Validation Service."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Service Configuration
    service_name: str = "ai-validation-service"
    service_version: str = "1.0.0"
    port: int = 8103
    log_level: str = "INFO"

    # AI Provider Configuration
    ai_provider: Literal["openai", "azure", "anthropic"] = "openai"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4"
    azure_openai_endpoint: str | None = None
    azure_openai_key: str | None = None
    azure_openai_deployment: str | None = None
    anthropic_api_key: str | None = None

    # PDD Co-Pilot Settings
    pdd_max_tokens: int = 4000
    pdd_temperature: float = 0.3
    si48_validation_enabled: bool = True

    # Additionality Checker Settings
    additionality_confidence_threshold: float = 0.7
    legislation_db_path: str | None = None

    # Remote Sensing Settings
    google_earth_engine_project: str | None = None
    satellite_default_sources: list[str] = ["landsat_8", "sentinel_2"]
    anomaly_detection_threshold: float = 0.85

    # Database
    database_url: str = "postgresql+asyncpg://localhost:5432/ai_validation"
    redis_url: str = "redis://localhost:6379/0"

    # External Services
    carbon_registry_url: str = "http://localhost:8102"

    # Governance
    audit_retention_days: int = 2555  # 7 years
    human_override_required_below_confidence: float = 0.6


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

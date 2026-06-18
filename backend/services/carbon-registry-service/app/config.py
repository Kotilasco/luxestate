from functools import lru_cache

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = Field(default="carbon-registry-service", alias="SERVICE_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(
        default="postgresql+asyncpg://zai_cts:zai_cts@localhost:5432/zai_cts",
        alias="DATABASE_URL",
    )
    jwt_issuer: AnyUrl | None = Field(default=None, alias="JWT_ISSUER")
    jwt_audience: str = Field(default="zai-cts-api", alias="JWT_AUDIENCE")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    ai_model_url: str = Field(default="http://localhost:8201", alias="AI_MODEL_URL")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

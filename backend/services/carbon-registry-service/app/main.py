from fastapi import FastAPI

from app.api.error_handlers import register_error_handlers
from app.api.v1.health import router as health_router
from app.api.v1.projects import router as projects_router
from app.config import get_settings
from app.observability.logging import configure_logging


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title="ZAI-CTS Carbon Registry Service",
        version="1.0.0",
        description="Production carbon project registry service for Zimbabwe AI-Enhanced Carbon Trading Ecosystem.",
        contact={"name": "ZAI-CTS Platform Team"},
        openapi_tags=[
            {"name": "Operations", "description": "Health and metrics endpoints"},
            {"name": "Carbon Projects", "description": "Carbon project registration and query APIs"},
        ],
    )
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(projects_router)
    return app


app = create_app()

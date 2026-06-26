from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import register_error_handlers
from app.api.v1.auth import router as auth_router, seed_administrator
from app.api.v1.health import router as health_router
from app.api.v1.national import operations_router, router as national_router
from app.api.v1.projects import router as projects_router
from app.api.v1.anchor import router as anchor_router
from app.config import get_settings
from app.infrastructure.database.session import get_session
from app.observability.logging import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    async for db in get_session():
        await seed_administrator(db)
        break
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(
        title="ZAI-CTS Carbon Registry Service",
        version="1.0.0",
        description="Production carbon project registry service for Zimbabwe AI-Enhanced Carbon Trading Ecosystem.",
        contact={"name": "ZAI-CTS Platform Team"},
        lifespan=lifespan,
        openapi_tags=[
            {"name": "Operations", "description": "Health and metrics endpoints"},
            {"name": "Identity and Access Management", "description": "User registration, login, sessions, approvals and API keys"},
            {"name": "Carbon Projects", "description": "Carbon project registration and query APIs"},
            {"name": "National Registry Readiness", "description": "National deployment stage controls and readiness gaps"},
            {"name": "National Registry Operations", "description": "Auditable national registry operating workflows"},
            {"name": "Anchors", "description": "Merkle root anchoring and chain verification"},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3004", "http://127.0.0.1:3000", "http://127.0.0.1:3004"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)
    app.include_router(auth_router)
    app.include_router(health_router)
    app.include_router(national_router)
    app.include_router(operations_router)
    app.include_router(projects_router)
    app.include_router(anchor_router)
    return app


app = create_app()

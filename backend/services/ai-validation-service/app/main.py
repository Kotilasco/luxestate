"""Main FastAPI application for AI Validation Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import pdd, additionality, remote_sensing, reports, advanced_ai
from app.config import get_settings


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ZAI-CTS AI Validation Service",
        version=settings.service_version,
        description="AI-powered project validation and MRV services for Zimbabwe Carbon Trading System.",
        contact={"name": "ZAI-CTS Platform Team"},
        openapi_tags=[
            {"name": "PDD Co-Pilot", "description": "AI-assisted Project Design Document creation"},
            {"name": "Additionality Checker", "description": "Project additionality assessment"},
            {"name": "Remote Sensing", "description": "Satellite imagery analysis and monitoring"},
            {"name": "AI Reports & Marketing", "description": "Natural language reporting and marketing analysis with LangChain + Gemini"},
            {"name": "Advanced AI Services", "description": "Leakage detection, price forecasting, and legal audit"},
        ],
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3004", "http://127.0.0.1:3000", "http://127.0.0.1:3004"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(pdd.router)
    app.include_router(additionality.router)
    app.include_router(remote_sensing.router)
    app.include_router(reports.router)
    app.include_router(advanced_ai.router)

    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "service": settings.service_name,
            "version": settings.service_version,
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

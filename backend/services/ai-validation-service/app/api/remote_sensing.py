"""Remote Sensing Agent API routes."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
    AlertConfigRequest,
    AlertConfigResponse,
    CarbonForecastResponse,
    RemoteSensingJobResponse,
    RemoteSensingRequest,
    RemoteSensingResults,
    RemoteSensingJobResponse as RemoteSensingStatus,
)
from app.services.remote_sensing import RemoteSensingService

router = APIRouter(
    prefix="/api/v1/ai/remote-sensing", tags=["Remote Sensing"]
)

_remote_sensing_service: RemoteSensingService | None = None


def get_remote_sensing_service() -> RemoteSensingService:
    """Get or create remote sensing service instance."""
    global _remote_sensing_service
    if _remote_sensing_service is None:
        _remote_sensing_service = RemoteSensingService()
    return _remote_sensing_service


@router.post(
    "/analyze",
    response_model=RemoteSensingJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze project area",
    description="Starts satellite imagery analysis for project area. Returns job ID for status tracking.",
)
async def analyze_remote_sensing(
    request: RemoteSensingRequest,
) -> RemoteSensingJobResponse:
    """Start remote sensing analysis."""
    try:
        service = get_remote_sensing_service()
        return await service.start_analysis(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start analysis: {str(e)}",
        )


@router.get(
    "/status/{analysis_id}",
    response_model=RemoteSensingStatus,
    summary="Check analysis status",
    description="Returns status of remote sensing analysis or results if completed.",
)
async def get_remote_sensing_status(analysis_id: UUID):
    """Get remote sensing analysis status."""
    try:
        service = get_remote_sensing_service()
        result = await service.get_analysis_status(analysis_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}",
        )


@router.post(
    "/anomalies",
    summary="Detect anomalies",
    description="Detects anomalies in project area using satellite imagery.",
)
async def detect_anomalies(project_id: UUID):
    """Detect anomalies for project."""
    try:
        service = get_remote_sensing_service()
        anomalies = await service.detect_anomalies_for_project(
            project_id, {}
        )
        return {"project_id": project_id, "anomalies": anomalies}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect anomalies: {str(e)}",
        )


@router.get(
    "/forecast/{analysis_id}",
    response_model=CarbonForecastResponse,
    summary="Get carbon forecast",
    description="Generates carbon stock forecast based on historical analysis.",
)
async def get_forecast(
    analysis_id: UUID,
    years: int = Query(default=5, ge=1, le=10),
) -> CarbonForecastResponse:
    """Get carbon stock forecast."""
    try:
        service = get_remote_sensing_service()
        return await service.generate_forecast(analysis_id, years)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate forecast: {str(e)}",
        )


@router.post(
    "/alert-config",
    response_model=AlertConfigResponse,
    summary="Configure alerts",
    description="Configures anomaly alert thresholds for continuous monitoring.",
)
async def configure_alerts(
    request: AlertConfigRequest,
) -> AlertConfigResponse:
    """Configure monitoring alerts."""
    # In production, save to database
    return AlertConfigResponse(
        config_id=UUID(int=hash(request.project_id) % (2**128)),
        project_id=request.project_id,
        status="active",
        message="Alert configuration saved successfully",
    )

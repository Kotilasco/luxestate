"""Additionality Checker API routes."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    AdditionalityRequest,
    AdditionalityResponse,
)
from app.services.additionality_checker import AdditionalityCheckerService

router = APIRouter(
    prefix="/api/v1/ai/additionality", tags=["Additionality Checker"]
)

_additionality_service: AdditionalityCheckerService | None = None


def get_additionality_service() -> AdditionalityCheckerService:
    """Get or create additionality service instance."""
    global _additionality_service
    if _additionality_service is None:
        _additionality_service = AdditionalityCheckerService()
    return _additionality_service


@router.post(
    "/analyze",
    response_model=AdditionalityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Full additionality assessment",
    description="Performs comprehensive additionality analysis including baseline, legislation, financial, and barrier assessment.",
)
async def analyze_additionality(
    request: AdditionalityRequest,
) -> AdditionalityResponse:
    """Analyze project additionality."""
    try:
        service = get_additionality_service()
        return await service.analyze_additionality(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze additionality: {str(e)}",
        )


@router.get(
    "/status/{assessment_id}",
    summary="Check assessment status",
    description="Returns the status of an additionality assessment.",
)
async def get_additionality_status(assessment_id: UUID):
    """Get additionality assessment status."""
    # For now, assessments are synchronous
    return {
        "assessment_id": assessment_id,
        "status": "completed",
        "message": "Assessment completed synchronously",
    }


@router.get(
    "/explain/{assessment_id}",
    summary="Get explanation",
    description="Returns human-readable explanation of additionality assessment.",
)
async def explain_additionality(assessment_id: UUID):
    """Get explanation for additionality assessment."""
    # In production, retrieve from database
    return {
        "assessment_id": assessment_id,
        "explanation": "Assessment based on baseline scenario analysis, legislative compliance check, financial viability without carbon revenue, and identified implementation barriers.",
        "key_factors": [
            "Project is not legally mandated",
            "Financial analysis shows limited viability without carbon revenue",
            "Multiple implementation barriers identified",
            "Baseline emissions significant without project intervention",
        ],
    }

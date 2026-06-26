"""PDD Co-Pilot API routes."""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.schemas import (
    MethodologySuggestionRequest,
    MethodologySuggestionResponse,
    PDDDraftRequest,
    PDDDraftResponse,
    PDDValidationRequest,
    PDDValidationResponse,
)
from app.services.pdd_copilot import PDDCopilotService

router = APIRouter(prefix="/api/v1/ai/pdd", tags=["PDD Co-Pilot"])

# Service instance (in production, use dependency injection)
_pdd_service: PDDCopilotService | None = None


def get_pdd_service() -> PDDCopilotService:
    """Get or create PDD service instance."""
    global _pdd_service
    if _pdd_service is None:
        _pdd_service = PDDCopilotService()
    return _pdd_service


@router.post(
    "/draft",
    response_model=PDDDraftResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate PDD draft from natural language",
    description="Takes a natural language project description and generates a structured PDD draft compliant with SI 48 of 2025.",
)
async def generate_pdd_draft(request: PDDDraftRequest) -> PDDDraftResponse:
    """Generate a PDD draft from natural language description."""
    try:
        service = get_pdd_service()
        return await service.generate_draft(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDD draft: {str(e)}",
        )


@router.post(
    "/validate",
    response_model=PDDValidationResponse,
    summary="Validate PDD against SI 48",
    description="Validates a PDD document against Zimbabwe SI 48 of 2025 formatting requirements.",
)
async def validate_pdd(request: PDDValidationRequest) -> PDDValidationResponse:
    """Validate a PDD against SI 48 requirements."""
    try:
        service = get_pdd_service()
        return await service.validate_pdd(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate PDD: {str(e)}",
        )


@router.post(
    "/suggest-method",
    response_model=MethodologySuggestionResponse,
    summary="Suggest applicable methodologies",
    description="Suggests VCS and Gold Standard methodologies applicable to the project type and description.",
)
async def suggest_methodologies(
    request: MethodologySuggestionRequest,
) -> MethodologySuggestionResponse:
    """Suggest methodologies for a project."""
    try:
        service = get_pdd_service()
        return await service.suggest_methodologies(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suggest methodologies: {str(e)}",
        )


@router.get(
    "/templates",
    summary="List PDD templates",
    description="Returns available PDD templates for different project types.",
)
async def list_templates() -> JSONResponse:
    """List available PDD templates."""
    templates = [
        {
            "id": "forestry-reforestation",
            "name": "Forestry Reforestation Template",
            "description": "PDD template for forest reforestation and restoration projects",
            "applicable_types": ["forestry"],
            "sections": [
                "executive_summary",
                "project_description",
                "baseline_scenario",
                "additionality",
                "monitoring_plan",
            ],
        },
        {
            "id": "agriculture-slm",
            "name": "Sustainable Land Management Template",
            "description": "PDD template for agricultural soil carbon projects",
            "applicable_types": ["agriculture"],
            "sections": [
                "executive_summary",
                "project_description",
                "baseline_scenario",
                "additionality",
                "monitoring_plan",
            ],
        },
        {
            "id": "renewable-energy",
            "name": "Renewable Energy Template",
            "description": "PDD template for solar, wind, and hydro projects",
            "applicable_types": ["renewable_energy"],
            "sections": [
                "executive_summary",
                "project_description",
                "baseline_scenario",
                "additionality",
                "monitoring_plan",
            ],
        },
        {
            "id": "waste-management",
            "name": "Waste Management Template",
            "description": "PDD template for methane capture and waste projects",
            "applicable_types": ["waste"],
            "sections": [
                "executive_summary",
                "project_description",
                "baseline_scenario",
                "additionality",
                "monitoring_plan",
            ],
        },
    ]

    return JSONResponse(content={"templates": templates})

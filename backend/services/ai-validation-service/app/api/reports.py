"""
API routes for AI-powered natural language reporting and marketing analysis.
Uses LangChain + Gemini 2.5 Flash for content generation.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

from app.services.langchain_service import get_langchain_service

router = APIRouter(prefix="/api/v1/ai/reports", tags=["AI Reports & Marketing"])


# ===== Request/Response Models =====

class NaturalLanguageReportRequest(BaseModel):
    report_type: str = Field(..., description="Type of report: carbon_impact, project_performance, market_analysis")
    data: Dict[str, Any] = Field(..., description="Structured data for the report")
    audience: str = Field(default="technical", description="Target audience: technical, executive, community, regulatory")
    language: str = Field(default="en", description="Output language: en, sn (Shona), nd (Ndebele)")


class NaturalLanguageReportResponse(BaseModel):
    report: str
    report_type: str
    audience: str
    generated_at: str
    word_count: int
    mock: bool = False


class MarketingAnalysisRequest(BaseModel):
    project_data: Dict[str, Any] = Field(..., description="Project details and metrics")
    target_market: str = Field(..., description="Target buyer segment: corporate, aviation, sovereign, voluntary")
    competitor_analysis: bool = Field(default=True, description="Include competitor comparison")


class MarketingAnalysisResponse(BaseModel):
    analysis: str
    project_id: Optional[str]
    target_market: str
    generated_at: str
    mock: bool = False


class BuyerSentimentRequest(BaseModel):
    market_data: Dict[str, Any] = Field(..., description="Current market metrics")
    buyer_feedback: List[str] = Field(default_factory=list, description="List of buyer comments")


class BuyerSentimentResponse(BaseModel):
    sentiment_analysis: str
    feedback_count: int
    generated_at: str
    mock: bool = False


class ProjectStoryRequest(BaseModel):
    project_data: Dict[str, Any] = Field(..., description="Project details and impact data")
    story_type: str = Field(default="impact", description="Type: impact, community, conservation, innovation")
    format: str = Field(default="narrative", description="Format: narrative, social_media, press_release, video_script")


class ProjectStoryResponse(BaseModel):
    story: str
    project_id: Optional[str]
    story_type: str
    format: str
    generated_at: str
    mock: bool = False


class NaturalLanguageQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language question")
    context: Dict[str, Any] = Field(default_factory=dict, description="Relevant data context")
    user_role: str = Field(default="general", description="User role: developer, buyer, regulator, community")


class NaturalLanguageQueryResponse(BaseModel):
    answer: str
    query: str
    user_role: str
    generated_at: str
    mock: bool = False


# ===== Endpoints =====

@router.post(
    "/generate",
    response_model=NaturalLanguageReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate natural language report",
    description="Generate AI-powered reports from structured data using Gemini 2.5 Flash",
)
async def generate_natural_language_report(request: NaturalLanguageReportRequest):
    """Generate a natural language report from structured data."""
    try:
        service = get_langchain_service()
        result = await service.generate_natural_language_report(
            report_type=request.report_type,
            data=request.data,
            audience=request.audience,
            language=request.language,
        )
        return NaturalLanguageReportResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.post(
    "/marketing-analysis",
    response_model=MarketingAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate marketing analysis",
    description="AI-powered marketing analysis and positioning for carbon projects",
)
async def generate_marketing_analysis(request: MarketingAnalysisRequest):
    """Generate marketing analysis and positioning for carbon projects."""
    try:
        service = get_langchain_service()
        result = await service.generate_marketing_analysis(
            project_data=request.project_data,
            target_market=request.target_market,
            competitor_analysis=request.competitor_analysis,
        )
        return MarketingAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate marketing analysis: {str(e)}",
        )


@router.post(
    "/sentiment-analysis",
    response_model=BuyerSentimentResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze buyer sentiment",
    description="Analyze buyer sentiment and market trends from feedback data",
)
async def analyze_buyer_sentiment(request: BuyerSentimentRequest):
    """Analyze buyer sentiment and market trends."""
    try:
        service = get_langchain_service()
        result = await service.analyze_buyer_sentiment(
            market_data=request.market_data,
            buyer_feedback=request.buyer_feedback,
        )
        return BuyerSentimentResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze sentiment: {str(e)}",
        )


@router.post(
    "/project-story",
    response_model=ProjectStoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate project story",
    description="Create compelling project stories for marketing and communications",
)
async def generate_project_story(request: ProjectStoryRequest):
    """Generate compelling project stories for marketing."""
    try:
        service = get_langchain_service()
        result = await service.generate_project_story(
            project_data=request.project_data,
            story_type=request.story_type,
            format=request.format,
        )
        return ProjectStoryResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate story: {str(e)}",
        )


@router.post(
    "/query",
    response_model=NaturalLanguageQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Natural language query",
    description="Answer natural language queries about carbon projects and markets",
)
async def answer_natural_language_query(request: NaturalLanguageQueryRequest):
    """Answer natural language queries about carbon projects."""
    try:
        service = get_langchain_service()
        result = await service.answer_natural_language_query(
            query=request.query,
            context=request.context,
            user_role=request.user_role,
        )
        return NaturalLanguageQueryResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}",
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="AI Reports service health",
)
async def health_check():
    """Health check for the AI reports service."""
    service = get_langchain_service()
    return {
        "status": "healthy",
        "service": "ai-reports",
        "mock_mode": service.mock_mode,
        "timestamp": datetime.utcnow().isoformat(),
    }

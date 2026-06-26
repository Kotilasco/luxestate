"""
Advanced AI API Routes
Leakage Detection, Price Forecasting, and Legal Audit
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

from app.services.leakage_detection import get_leakage_service
from app.services.price_forecasting import get_price_forecasting_service
from app.services.legal_audit import get_legal_audit_service

router = APIRouter(prefix="/api/v1/ai/advanced", tags=["Advanced AI Services"])


# ===== Leakage Detection Models =====

class LeakageAnalysisRequest(BaseModel):
    project_id: str
    project_name: str
    project_geometry: Dict[str, Any] = Field(..., description="GeoJSON polygon of project boundary")
    baseline_year: int
    current_year: int


class LeakageZoneResponse(BaseModel):
    zone_id: str
    distance_km: float
    direction: str
    baseline_forest_cover: float
    current_forest_cover: float
    deforestation_rate: float
    risk_level: str
    confidence: float


class LeakageAnalysisResponse(BaseModel):
    project_id: str
    project_name: str
    analysis_date: str
    buffer_zones_analyzed: int
    leakage_detected: bool
    overall_risk_level: str
    zones: List[LeakageZoneResponse]
    recommendations: List[str]
    mitigation_strategies: List[str]


# ===== Price Forecasting Models =====

class FairValueRequest(BaseModel):
    project_type: str
    vintage: int
    verification_standard: str
    co_benefits: Optional[List[str]] = None


class FairValueResponse(BaseModel):
    project_type: str
    vintage: int
    verification_standard: str
    current_market_price: float
    fair_value_estimate: float
    price_range_low: float
    price_range_high: float
    confidence: float
    factors: Dict[str, float]
    recommendation: str


class PriceForecastRequest(BaseModel):
    project_type: str
    verification_standard: str
    horizon_days: int = Field(default=90, ge=30, le=365)


class PriceForecastPoint(BaseModel):
    date: str
    predicted_price: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    confidence: float


class PriceForecastResponse(BaseModel):
    project_type: str
    forecasts: List[PriceForecastPoint]
    generated_at: str


class MarketTrendResponse(BaseModel):
    trend_direction: str
    trend_strength: float
    support_level: float
    resistance_level: float
    volatility_index: float
    market_sentiment: str
    analysis_date: str


# ===== Legal Audit Models =====

class LegalAuditRequest(BaseModel):
    agreement_id: str
    agreement_title: str
    agreement_text: str
    agreement_type: str = "article_6_2"
    parties: Optional[List[str]] = None


class LegalClauseResponse(BaseModel):
    clause_number: int
    clause_title: str
    original_text: str
    risk_level: str
    zim_law_alignment: str
    issues: List[str]
    recommendations: List[str]
    suggested_revisions: Optional[str]


class LegalAuditResponse(BaseModel):
    agreement_id: str
    agreement_title: str
    audit_date: str
    overall_risk_level: str
    zim_law_compliance_score: float
    clauses_analyzed: int
    clauses: List[LegalClauseResponse]
    summary: str
    key_findings: List[str]
    required_amendments: List[str]
    approval_recommendation: str


class RequirementCheckRequest(BaseModel):
    agreement_text: str
    requirement_type: str


class TemplateComparisonRequest(BaseModel):
    agreement_text: str
    template_type: str = "zim_standard"


# ===== Endpoints =====

@router.post(
    "/leakage/analyze",
    response_model=LeakageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze project leakage",
    description="Detect activity displacement around carbon projects using satellite data analysis",
)
async def analyze_leakage(request: LeakageAnalysisRequest):
    """Analyze potential leakage around a carbon project."""
    try:
        service = get_leakage_service()
        result = await service.analyze_project_leakage(
            project_id=request.project_id,
            project_name=request.project_name,
            project_geometry=request.project_geometry,
            baseline_year=request.baseline_year,
            current_year=request.current_year,
        )
        
        return LeakageAnalysisResponse(
            project_id=result.project_id,
            project_name=result.project_name,
            analysis_date=result.analysis_date.isoformat(),
            buffer_zones_analyzed=result.buffer_zones_analyzed,
            leakage_detected=result.leakage_detected,
            overall_risk_level=result.overall_risk_level,
            zones=[
                LeakageZoneResponse(
                    zone_id=z.zone_id,
                    distance_km=z.distance_km,
                    direction=z.direction,
                    baseline_forest_cover=z.baseline_forest_cover,
                    current_forest_cover=z.current_forest_cover,
                    deforestation_rate=z.deforestation_rate,
                    risk_level=z.risk_level,
                    confidence=z.confidence,
                )
                for z in result.zones
            ],
            recommendations=result.recommendations,
            mitigation_strategies=result.mitigation_strategies,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Leakage analysis failed: {str(e)}",
        )


@router.post(
    "/pricing/fair-value",
    response_model=FairValueResponse,
    status_code=status.HTTP_200_OK,
    summary="Get fair value estimate",
    description="ML-based fair value estimate for Zimbabwe carbon credits using GEO/N-GEO market data",
)
async def get_fair_value(request: FairValueRequest):
    """Get fair value estimate for carbon credits."""
    try:
        service = get_price_forecasting_service()
        result = await service.get_fair_value_estimate(
            project_type=request.project_type,
            vintage=request.vintage,
            verification_standard=request.verification_standard,
            co_benefits=request.co_benefits,
        )
        
        return FairValueResponse(
            project_type=result.project_type,
            vintage=result.vintage,
            verification_standard=result.verification_standard,
            current_market_price=result.current_market_price,
            fair_value_estimate=result.fair_value_estimate,
            price_range_low=result.price_range_low,
            price_range_high=result.price_range_high,
            confidence=result.confidence,
            factors=result.factors,
            recommendation=result.recommendation,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fair value estimation failed: {str(e)}",
        )


@router.post(
    "/pricing/forecast",
    response_model=PriceForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Forecast carbon prices",
    description="Generate price forecasts for carbon credits using ML model",
)
async def forecast_prices(request: PriceForecastRequest):
    """Generate price forecasts for carbon credits."""
    try:
        service = get_price_forecasting_service()
        forecasts = await service.forecast_prices(
            project_type=request.project_type,
            verification_standard=request.verification_standard,
            horizon_days=request.horizon_days,
        )
        
        return PriceForecastResponse(
            project_type=request.project_type,
            forecasts=[
                PriceForecastPoint(
                    date=f.date.isoformat(),
                    predicted_price=f.predicted_price,
                    confidence_interval_lower=f.confidence_interval_lower,
                    confidence_interval_upper=f.confidence_interval_upper,
                    confidence=f.confidence,
                )
                for f in forecasts
            ],
            generated_at=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Price forecasting failed: {str(e)}",
        )


@router.get(
    "/pricing/market-trends",
    response_model=MarketTrendResponse,
    status_code=status.HTTP_200_OK,
    summary="Get market trends",
    description="Analyze current carbon market trends",
)
async def get_market_trends():
    """Get current carbon market trend analysis."""
    try:
        service = get_price_forecasting_service()
        trends = await service.analyze_market_trends()
        
        return MarketTrendResponse(
            trend_direction=trends.trend_direction,
            trend_strength=trends.trend_strength,
            support_level=trends.support_level,
            resistance_level=trends.resistance_level,
            volatility_index=trends.volatility_index,
            market_sentiment=trends.market_sentiment,
            analysis_date=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Market trend analysis failed: {str(e)}",
        )


@router.post(
    "/legal/audit",
    response_model=LegalAuditResponse,
    status_code=status.HTTP_200_OK,
    summary="Audit bilateral agreement",
    description="AI-powered legal audit of Article 6.2 agreements for Zimbabwe law compliance",
)
async def audit_agreement(request: LegalAuditRequest):
    """Audit a bilateral agreement for legal compliance."""
    try:
        service = get_legal_audit_service()
        result = await service.audit_bilateral_agreement(
            agreement_id=request.agreement_id,
            agreement_title=request.agreement_title,
            agreement_text=request.agreement_text,
            agreement_type=request.agreement_type,
            parties=request.parties,
        )
        
        return LegalAuditResponse(
            agreement_id=result.agreement_id,
            agreement_title=result.agreement_title,
            audit_date=result.audit_date.isoformat(),
            overall_risk_level=result.overall_risk_level,
            zim_law_compliance_score=result.zim_law_compliance_score,
            clauses_analyzed=result.clauses_analyzed,
            clauses=[
                LegalClauseResponse(
                    clause_number=c.clause_number,
                    clause_title=c.clause_title,
                    original_text=c.original_text,
                    risk_level=c.risk_level,
                    zim_law_alignment=c.zim_law_alignment,
                    issues=c.issues,
                    recommendations=c.recommendations,
                    suggested_revisions=c.suggested_revisions,
                )
                for c in result.clauses
            ],
            summary=result.summary,
            key_findings=result.key_findings,
            required_amendments=result.required_amendments,
            approval_recommendation=result.approval_recommendation,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Legal audit failed: {str(e)}",
        )


@router.post(
    "/legal/check-requirement",
    status_code=status.HTTP_200_OK,
    summary="Check specific requirement",
    description="Check agreement against specific Zimbabwe legal requirement",
)
async def check_requirement(request: RequirementCheckRequest):
    """Check agreement against specific legal requirement."""
    try:
        service = get_legal_audit_service()
        result = await service.check_specific_requirements(
            agreement_text=request.agreement_text,
            requirement_type=request.requirement_type,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Requirement check failed: {str(e)}",
        )


@router.post(
    "/legal/compare-template",
    status_code=status.HTTP_200_OK,
    summary="Compare with template",
    description="Compare agreement against Zimbabwe standard templates",
)
async def compare_template(request: TemplateComparisonRequest):
    """Compare agreement against standard templates."""
    try:
        service = get_legal_audit_service()
        result = await service.compare_with_template(
            agreement_text=request.agreement_text,
            template_type=request.template_type,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template comparison failed: {str(e)}",
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check for advanced AI services."""
    return {
        "status": "healthy",
        "service": "advanced-ai",
        "timestamp": datetime.utcnow().isoformat(),
    }

"""Additionality Checker service for assessing project additionality."""

import json
import re
from datetime import datetime
from typing import Any

import structlog

from app.config import get_settings
from app.models.schemas import (
    AdditionalityConclusion,
    AdditionalityRequest,
    AdditionalityResponse,
    AIResultMetadata,
    BarrierAnalysis,
    BarrierAssessment,
    BaselineAnalysis,
    FinancialAnalysis,
    LegislationAnalysis,
    LegislationMatch,
)

logger = structlog.get_logger()

# Zimbabwe Legislation Database (simplified for demonstration)
# In production, this would be loaded from a vector database
LEGISLATION_DB = [
    {
        "reference": "SI 48 of 2025",
        "title": "Carbon Trading and Climate Change Mitigation",
        "relevant_sections": [
            {
                "section": "Section 12",
                "requirement": "All carbon projects must demonstrate additionality",
                "applicable_types": ["all"],
            },
            {
                "section": "Section 15",
                "requirement": "Projects must not be legally mandated activities",
                "applicable_types": ["all"],
            },
        ],
    },
    {
        "reference": "Forest Act Chapter 19:05",
        "title": "Forest Management and Conservation",
        "relevant_sections": [
            {
                "section": "Section 35",
                "requirement": "Forestry projects require EIA for areas > 100ha",
                "applicable_types": ["forestry"],
            },
            {
                "section": "Section 42",
                "requirement": "Planting of invasive species prohibited",
                "applicable_types": ["forestry"],
            },
        ],
    },
    {
        "reference": "Environmental Management Act",
        "title": "Environmental Protection",
        "relevant_sections": [
            {
                "section": "Section 97",
                "requirement": "Industrial projects require emissions permits",
                "applicable_types": ["industrial", "waste"],
            },
            {
                "section": "Section 102",
                "requirement": "Waste management facilities require licensing",
                "applicable_types": ["waste"],
            },
        ],
    },
    {
        "reference": "Rural District Councils Act",
        "title": "Local Authority Regulations",
        "relevant_sections": [
            {
                "section": "Section 76",
                "requirement": "Land use changes require council approval",
                "applicable_types": ["forestry", "agriculture"],
            },
        ],
    },
    {
        "reference": "Energy Regulatory Authority Act",
        "title": "Energy Sector Regulation",
        "relevant_sections": [
            {
                "section": "Section 28",
                "requirement": "Power generation > 1MW requires license",
                "applicable_types": ["renewable_energy"],
            },
            {
                "section": "Section 45",
                "requirement": "Grid connection requires technical approval",
                "applicable_types": ["renewable_energy"],
            },
        ],
    },
]

# Baseline emission factors by project type (simplified)
BASELINE_FACTORS = {
    "forestry": {
        "deforestation_rate": 0.02,  # 2% annual deforestation
        "emission_factor_tco2e_per_ha": 150,
        "baseline_scenario": "Continued degradation and eventual conversion to agriculture",
    },
    "agriculture": {
        "soil_carbon_loss_rate": 0.03,  # 3% annual loss
        "emission_factor_tco2e_per_ha": 25,
        "baseline_scenario": "Continued conventional farming with soil degradation",
    },
    "renewable_energy": {
        "grid_emission_factor_tco2e_per_mwh": 0.8,  # Zimbabwe grid factor
        "capacity_factor": 0.25,
        "baseline_scenario": "Electricity from fossil fuel grid mix",
    },
    "waste": {
        "methane_potential_m3_per_tonne": 100,
        "methane_global_warming_potential": 28,
        "baseline_scenario": "Uncontrolled decomposition with methane venting",
    },
    "industrial": {
        "emission_reduction_potential_percent": 15,
        "baseline_scenario": "Continued operation without emission controls",
    },
}


class AdditionalityCheckerService:
    """Service for assessing carbon project additionality."""

    def __init__(self):
        self.settings = get_settings()

    async def analyze_additionality(
        self, request: AdditionalityRequest
    ) -> AdditionalityResponse:
        """Perform comprehensive additionality analysis."""
        logger.info(
            "Analyzing additionality",
            project_id=str(request.project_id),
            project_type=request.project_type,
        )

        # Run all analyses
        baseline = await self._analyze_baseline(request)
        legislation = await self._analyze_legislation(request)
        financial = await self._analyze_financial(request)
        barriers = await self._analyze_barriers(request)

        # Calculate overall score
        overall_score = self._calculate_overall_score(
            baseline, legislation, financial, barriers
        )

        # Determine conclusion
        conclusion, confidence = self._determine_conclusion(
            overall_score, legislation, financial
        )

        # Generate reasoning summary
        reasoning = self._generate_reasoning_summary(
            conclusion, baseline, legislation, financial, barriers
        )

        metadata = AIResultMetadata(
            confidence_score=confidence,
            explanation=reasoning,
            evidence_references=[
                "si-48-2025",
                "zimbabwe-forest-act",
                "ema-act",
                "financial-analysis-model",
            ],
            model_version="additionality-checker-v2.1",
        )

        return AdditionalityResponse(
            project_id=request.project_id,
            overall_score=overall_score,
            conclusion=conclusion,
            confidence=confidence,
            baseline_scenario=baseline,
            legislation_analysis=legislation,
            financial_analysis=financial,
            barrier_analysis=barriers,
            reasoning_summary=reasoning,
            metadata=metadata,
        )

    async def _analyze_baseline(
        self, request: AdditionalityRequest
    ) -> BaselineAnalysis:
        """Analyze baseline scenario for the project."""
        project_type = request.project_type
        factors = BASELINE_FACTORS.get(project_type, {})

        # Estimate area/size from description (simplified)
        area_ha = self._extract_area_hectares(request.project_description)
        size_kw = self._extract_size_kw(request.project_description)

        if project_type == "forestry" and area_ha:
            emissions = (
                area_ha
                * factors.get("deforestation_rate", 0.02)
                * factors.get("emission_factor_tco2e_per_ha", 150)
            )
        elif project_type == "agriculture" and area_ha:
            emissions = (
                area_ha
                * factors.get("soil_carbon_loss_rate", 0.03)
                * factors.get("emission_factor_tco2e_per_ha", 25)
            )
        elif project_type == "renewable_energy" and size_kw:
            annual_generation = size_kw * 8760 * factors.get("capacity_factor", 0.25)
            emissions = (
                annual_generation / 1000 * factors.get("grid_emission_factor_tco2e_per_mwh", 0.8)
            )
        elif project_type == "waste":
            # Estimate waste volume from description
            waste_tonnes = self._extract_waste_tonnes(request.project_description)
            emissions = (
                waste_tonnes
                * factors.get("methane_potential_m3_per_tonne", 100)
                * factors.get("methane_global_warming_potential", 28)
                * 0.00067
            )  # kg to tonnes
        else:
            emissions = 0.0

        return BaselineAnalysis(
            baseline_emissions_tco2e_per_year=round(emissions, 2),
            baseline_scenario_description=factors.get(
                "baseline_scenario", "Business as usual continuation"
            ),
            calculation_methodology=f"Baseline factors for {project_type} projects in Zimbabwe context",
            confidence=0.75 if emissions > 0 else 0.5,
        )

    def _extract_area_hectares(self, description: str) -> float | None:
        """Extract area in hectares from description."""
        # Look for patterns like "500 hectares", "500 ha", "500ha"
        patterns = [
            r"(\d+)\s*hectares",
            r"(\d+)\s*ha\b",
            r"(\d+)\s*km2",
        ]
        for pattern in patterns:
            match = re.search(pattern, description.lower())
            if match:
                value = float(match.group(1))
                if "km2" in pattern:
                    value *= 100  # Convert km2 to hectares
                return value
        return None

    def _extract_size_kw(self, description: str) -> float | None:
        """Extract power capacity in kW from description."""
        patterns = [
            r"(\d+)\s*mw",
            r"(\d+)\s*megawatt",
            r"(\d+)\s*kw",
            r"(\d+)\s*kilowatt",
        ]
        for pattern in patterns:
            match = re.search(pattern, description.lower())
            if match:
                value = float(match.group(1))
                if "mw" in pattern or "megawatt" in pattern:
                    value *= 1000  # Convert MW to kW
                return value
        return None

    def _extract_waste_tonnes(self, description: str) -> float:
        """Extract waste volume in tonnes from description."""
        patterns = [
            r"(\d+)\s*tonnes",
            r"(\d+)\s*tons",
            r"(\d+)\s*tpa",  # tonnes per annum
        ]
        for pattern in patterns:
            match = re.search(pattern, description.lower())
            if match:
                return float(match.group(1))
        return 1000.0  # Default assumption

    async def _analyze_legislation(
        self, request: AdditionalityRequest
    ) -> LegislationAnalysis:
        """Analyze project against Zimbabwe legislation."""
        applicable_laws = []
        conflicts = []

        for law in LEGISLATION_DB:
            for section in law["relevant_sections"]:
                # Check if applicable to project type
                if (
                    "all" not in section["applicable_types"]
                    and request.project_type not in section["applicable_types"]
                ):
                    continue

                # Determine compliance status (simplified)
                status = self._check_legislative_compliance(
                    section["requirement"], request
                )

                applicable_laws.append(
                    LegislationMatch(
                        law_reference=f"{law['reference']} - {section['section']}",
                        requirement=section["requirement"],
                        compliance_status=status,
                    )
                )

                if status == "non_compliant":
                    conflicts.append(
                        f"{law['reference']} {section['section']}: {section['requirement']}"
                    )

        # Calculate compliance score
        if applicable_laws:
            compliant_count = sum(
                1 for law in applicable_laws if law.compliance_status == "compliant"
            )
            score = compliant_count / len(applicable_laws)
        else:
            score = 1.0

        return LegislationAnalysis(
            applicable_laws=applicable_laws,
            conflicts_identified=conflicts,
            overall_compliance_score=round(score, 2),
        )

    def _check_legislative_compliance(
        self, requirement: str, request: AdditionalityRequest
    ) -> str:
        """Check if project complies with legislative requirement."""
        # Simplified compliance checking based on keywords
        requirement_lower = requirement.lower()
        description_lower = request.project_description.lower()

        # Check for common compliance indicators
        if "eia" in requirement_lower:
            # Assume compliance if project mentions environmental assessment
            return (
                "compliant"
                if "environmental" in description_lower or "eia" in description_lower
                else "not_applicable"
            )

        if "invasive" in requirement_lower:
            return (
                "compliant"
                if "native" in description_lower
                else "not_applicable"
            )

        if "license" in requirement_lower or "permit" in requirement_lower:
            return "compliant"  # Assume compliant if not explicitly stated otherwise

        if "mandated" in requirement_lower or "legally required" in requirement_lower:
            return (
                "non_compliant"
                if "legally required" in description_lower
                else "compliant"
            )

        return "compliant"

    async def _analyze_financial(
        self, request: AdditionalityRequest
    ) -> FinancialAnalysis:
        """Analyze financial viability without carbon revenue."""
        data = request.financial_data

        if data:
            # Use provided financial data
            irr_without = data.irr_without_carbon

            # Estimate carbon revenue impact
            if data.carbon_revenue_percentage and data.carbon_revenue_percentage > 30:
                carbon_dependence = "critical"
            elif data.carbon_revenue_percentage and data.carbon_revenue_percentage > 15:
                carbon_dependence = "significant"
            elif data.carbon_revenue_percentage and data.carbon_revenue_percentage > 5:
                carbon_dependence = "minor"
            else:
                carbon_dependence = "none"

            viable_without = irr_without is not None and irr_without > 8.0
        else:
            # Estimate based on project type and description
            irr_without = self._estimate_irr_without_carbon(request)
            carbon_dependence = self._estimate_carbon_dependence(request)
            viable_without = False  # Conservative assumption

        notes = self._generate_financial_notes(request, viable_without, carbon_dependence)

        return FinancialAnalysis(
            irr_without_carbon=irr_without,
            irr_with_carbon=None,  # Would require carbon price forecasting
            financial_viability_without_carbon=viable_without,
            carbon_revenue_dependence=carbon_dependence,
            analysis_notes=notes,
        )

    def _estimate_irr_without_carbon(self, request: AdditionalityRequest) -> float:
        """Estimate IRR without carbon revenue based on project type."""
        # Conservative estimates based on project type
        irr_estimates = {
            "forestry": 3.5,
            "agriculture": 4.0,
            "renewable_energy": 6.5,
            "waste": 5.0,
            "industrial": 7.0,
        }
        return irr_estimates.get(request.project_type, 4.0)

    def _estimate_carbon_dependence(
        self, request: AdditionalityRequest
    ) -> str:
        """Estimate carbon revenue dependence."""
        # Keywords indicating high carbon dependence
        high_dependence_keywords = [
            "carbon finance",
            "carbon revenue",
            "credits essential",
            "only viable with",
        ]

        desc_lower = request.project_description.lower()
        for keyword in high_dependence_keywords:
            if keyword in desc_lower:
                return "critical"

        # Check project type defaults
        default_dependence = {
            "forestry": "critical",
            "agriculture": "significant",
            "renewable_energy": "minor",
            "waste": "significant",
            "industrial": "minor",
        }
        return default_dependence.get(request.project_type, "significant")

    def _generate_financial_notes(
        self,
        request: AdditionalityRequest,
        viable_without: bool,
        carbon_dependence: str,
    ) -> str:
        """Generate financial analysis notes."""
        if viable_without:
            return (
                f"Project shows financial viability without carbon revenue (IRR > 8%). "
                f"Carbon revenue classified as '{carbon_dependence}' for project economics. "
                f"Detailed investment analysis recommended."
            )
        else:
            return (
                f"Project demonstrates limited financial attractiveness without carbon revenue. "
                f"Carbon revenue classified as '{carbon_dependence}'. "
                f"{self._get_barrier_text(request.project_type)} "
                f"This supports the additionality argument."
            )

    def _get_barrier_text(self, project_type: str) -> str:
        """Get barrier description for project type."""
        barriers = {
            "forestry": "Long payback periods and high upfront costs are typical barriers.",
            "agriculture": "Transition costs and yield uncertainty create adoption barriers.",
            "renewable_energy": "Grid integration costs and off-take risks are key barriers.",
            "waste": "High capital costs and technical complexity are barriers.",
            "industrial": "Technology switching costs and operational disruption are barriers.",
        }
        return barriers.get(project_type, "Various barriers exist.")

    async def _analyze_barriers(
        self, request: AdditionalityRequest
    ) -> BarrierAnalysis:
        """Analyze barriers to project implementation."""
        barriers = []

        # Analyze provided barriers
        for barrier_desc in request.barriers:
            barrier_type = self._classify_barrier_type(barrier_desc)
            severity = self._assess_barrier_severity(barrier_desc, barrier_type)

            barriers.append(
                BarrierAssessment(
                    barrier_type=barrier_type,
                    description=barrier_desc,
                    severity=severity,
                    evidence="Provided by project proponent",
                )
            )

        # Add typical barriers for project type if not already mentioned
        typical_barriers = self._get_typical_barriers(request.project_type)
        for typical in typical_barriers:
            if not any(
                typical["description"].lower() in b.description.lower() for b in barriers
            ):
                barriers.append(
                    BarrierAssessment(
                        barrier_type=typical["type"],
                        description=typical["description"],
                        severity=typical["severity"],
                        evidence="Industry standard analysis",
                    )
                )

        # Calculate overall barrier score
        high_count = sum(1 for b in barriers if b.severity == "high")
        medium_count = sum(1 for b in barriers if b.severity == "medium")
        barrier_score = min(1.0, (high_count * 0.3 + medium_count * 0.15))

        return BarrierAnalysis(
            identified_barriers=barriers,
            overall_barrier_score=round(barrier_score, 2),
        )

    def _classify_barrier_type(self, description: str) -> str:
        """Classify barrier by type."""
        desc_lower = description.lower()

        if any(word in desc_lower for word in ["cost", "finance", "investment", "funding"]):
            return "financial"
        elif any(word in desc_lower for word in ["regulation", "permit", "license", "policy"]):
            return "institutional"
        elif any(word in desc_lower for word in ["technical", "technology", "expertise", "skill"]):
            return "technical"
        elif any(word in desc_lower for word in ["community", "social", "cultural", "acceptance"]):
            return "social"
        return "financial"  # Default

    def _assess_barrier_severity(self, description: str, barrier_type: str) -> str:
        """Assess barrier severity."""
        desc_lower = description.lower()

        # High severity indicators
        if any(
            word in desc_lower
            for word in ["impossible", "prohibitive", "no access", "critical"]
        ):
            return "high"

        # Medium severity indicators
        if any(word in desc_lower for word in ["difficult", "limited", "challenging"]):
            return "medium"

        # Type-based defaults
        if barrier_type == "financial":
            return "high"
        elif barrier_type == "institutional":
            return "medium"

        return "low"

    def _get_typical_barriers(self, project_type: str) -> list[dict]:
        """Get typical barriers for project type."""
        barriers = {
            "forestry": [
                {
                    "type": "financial",
                    "description": "High upfront establishment costs with 10-20 year payback period",
                    "severity": "high",
                },
                {
                    "type": "institutional",
                    "description": "Land tenure insecurity and risk of conversion",
                    "severity": "high",
                },
            ],
            "agriculture": [
                {
                    "type": "financial",
                    "description": "Transition costs and potential yield reduction during adoption",
                    "severity": "medium",
                },
                {
                    "type": "technical",
                    "description": "Lack of technical knowledge on sustainable practices",
                    "severity": "medium",
                },
            ],
            "renewable_energy": [
                {
                    "type": "financial",
                    "description": "High capital costs for equipment and grid connection",
                    "severity": "high",
                },
                {
                    "type": "institutional",
                    "description": "Complex licensing and grid approval processes",
                    "severity": "medium",
                },
            ],
            "waste": [
                {
                    "type": "financial",
                    "description": "High capital investment for waste processing infrastructure",
                    "severity": "high",
                },
                {
                    "type": "technical",
                    "description": "Technical complexity of methane capture systems",
                    "severity": "medium",
                },
            ],
            "industrial": [
                {
                    "type": "financial",
                    "description": "Capital costs for technology switching",
                    "severity": "medium",
                },
                {
                    "type": "technical",
                    "description": "Operational disruption during implementation",
                    "severity": "medium",
                },
            ],
        }
        return barriers.get(project_type, [])

    def _calculate_overall_score(
        self,
        baseline: BaselineAnalysis,
        legislation: LegislationAnalysis,
        financial: FinancialAnalysis,
        barriers: BarrierAnalysis,
    ) -> float:
        """Calculate overall additionality score."""
        # Weighted scoring
        weights = {
            "baseline": 0.20,
            "legislation": 0.25,
            "financial": 0.30,
            "barriers": 0.25,
        }

        baseline_score = baseline.confidence * 100
        legislation_score = legislation.overall_compliance_score * 100
        financial_score = (
            80 if financial.carbon_revenue_dependence == "critical" else
            60 if financial.carbon_revenue_dependence == "significant" else
            40 if financial.carbon_revenue_dependence == "minor" else
            20
        )
        barrier_score = barriers.overall_barrier_score * 100

        overall = (
            baseline_score * weights["baseline"]
            + legislation_score * weights["legislation"]
            + financial_score * weights["financial"]
            + barrier_score * weights["barriers"]
        )

        return round(overall, 1)

    def _determine_conclusion(
        self, score: float, legislation: LegislationAnalysis, financial: FinancialAnalysis
    ) -> tuple[AdditionalityConclusion, float]:
        """Determine additionality conclusion."""
        # Check for disqualifying factors
        if legislation.conflicts_identified:
            return AdditionalityConclusion.NOT_ADDITIONAL, 0.9

        if financial.financial_viability_without_carbon:
            return AdditionalityConclusion.NOT_ADDITIONAL, 0.8

        # Score-based determination
        if score >= 70:
            return AdditionalityConclusion.ADDITIONAL, min(0.95, score / 100)
        elif score >= 50:
            return AdditionalityConclusion.ADDITIONAL, 0.7
        elif score >= 30:
            return AdditionalityConclusion.INCONCLUSIVE, 0.6
        else:
            return AdditionalityConclusion.NOT_ADDITIONAL, 0.7

    def _generate_reasoning_summary(
        self,
        conclusion: AdditionalityConclusion,
        baseline: BaselineAnalysis,
        legislation: LegislationAnalysis,
        financial: FinancialAnalysis,
        barriers: BarrierAnalysis,
    ) -> str:
        """Generate human-readable reasoning summary."""
        parts = []

        parts.append(f"Baseline scenario analysis shows {baseline.baseline_emissions_tco2e_per_year} tCO2e/year emissions without project.")

        if legislation.conflicts_identified:
            parts.append(f"Legislative conflicts identified: {len(legislation.conflicts_identified)}")
        else:
            parts.append("Project is not legally mandated and exceeds regulatory requirements.")

        parts.append(f"Financial analysis indicates {financial.carbon_revenue_dependence} dependence on carbon revenue.")

        high_barriers = [b for b in barriers.identified_barriers if b.severity == "high"]
        if high_barriers:
            parts.append(f"{len(high_barriers)} high-severity barriers identified.")

        parts.append(f"Overall conclusion: {conclusion.value.replace('_', ' ').title()}")

        return " ".join(parts)

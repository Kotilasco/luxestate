"""PDD Co-Pilot service for AI-assisted Project Design Document creation."""

import json
from datetime import datetime
from typing import Any
from uuid import UUID

import httpx
import structlog

from app.config import get_settings
from app.models.schemas import (
    AIResultMetadata,
    MethodologyMatch,
    PDDDrafSection,
    PDDDraftRequest,
    PDDDraftResponse,
    PDDValidationRequest,
    PDDValidationResponse,
    SI48Violation,
    MethodologySuggestionRequest,
    MethodologySuggestionResponse,
)

logger = structlog.get_logger()

# SI 48 Section Requirements (Zimbabwe Statutory Instrument 48 of 2025)
SI48_SECTIONS = {
    "executive_summary": {
        "required_elements": [
            "project_title",
            "project_proponent",
            "project_location",
            "project_type",
            "estimated_credits",
            "crediting_period",
        ],
        "min_length": 200,
        "max_length": 1000,
    },
    "project_description": {
        "required_elements": [
            "site_description",
            "current_land_use",
            "project_intervention",
            "technology_employed",
            "implementation_schedule",
        ],
        "min_length": 500,
        "max_length": 5000,
    },
    "baseline_scenario": {
        "required_elements": [
            "baseline_emissions",
            "baseline_methodology",
            "data_sources",
            "assumptions",
        ],
        "min_length": 300,
        "max_length": 3000,
    },
    "additionality": {
        "required_elements": [
            "investment_analysis",
            "barrier_analysis",
            "common_practice",
            "regulatory_surplus",
        ],
        "min_length": 400,
        "max_length": 4000,
    },
    "monitoring_plan": {
        "required_elements": [
            "monitoring_parameters",
            "measurement_methods",
            "data_quality_control",
            "reporting_frequency",
        ],
        "min_length": 300,
        "max_length": 3000,
    },
}

# Common VCS/Gold Standard methodologies for matching
METHODOLOGY_LIBRARY = [
    {
        "id": "VCS-VM0015",
        "name": "Afforestation, Reforestation and Revegetation",
        "types": ["forestry"],
        "keywords": ["forest", "tree", "reforestation", "afforestation", "planting"],
        "applicability": [
            "Project involves planting trees",
            "Land was not forested for at least 10 years",
            "Native or non-invasive species",
        ],
    },
    {
        "id": "VCS-VM0022",
        "name": "Forest Restoration with Native Species",
        "types": ["forestry"],
        "keywords": ["restoration", "native", "forest", "biodiversity"],
        "applicability": [
            "Uses native species only",
            "Restores degraded forest",
            "Maintains biodiversity",
        ],
    },
    {
        "id": "VCS-VM0017",
        "name": "Afforestation and Reforestation of Lands Except Wetlands",
        "types": ["forestry"],
        "keywords": ["afforestation", "reforestation", "upland"],
        "applicability": [
            "Not in wetland areas",
            "Converts non-forest to forest",
        ],
    },
    {
        "id": "VCS-VM0025",
        "name": "Sustainable Agricultural Land Management",
        "types": ["agriculture"],
        "keywords": ["agriculture", "soil", "carbon", "farming", "sustainable"],
        "applicability": [
            "Changes agricultural practices",
            "Increases soil carbon sequestration",
            "Sustainable land management",
        ],
    },
    {
        "id": "VCS-VM0018",
        "name": "Avoided Grassland Conversion",
        "types": ["agriculture"],
        "keywords": ["grassland", "conversion", "protected"],
        "applicability": [
            "Prevents grassland conversion",
            "Maintains carbon stocks",
        ],
    },
    {
        "id": "VCS-ACM0002",
        "name": "Renewable Energy Projects",
        "types": ["renewable_energy"],
        "keywords": ["renewable", "solar", "wind", "hydro", "energy"],
        "applicability": [
            "Generates renewable electricity",
            "Replaces fossil fuel grid power",
        ],
    },
    {
        "id": "GS-TPM-1191",
        "name": "Grid-Connected Renewable Electricity Generation",
        "types": ["renewable_energy"],
        "keywords": ["grid", "renewable", "electricity", "solar", "wind"],
        "applicability": [
            "Connected to national grid",
            "Replaces fossil fuel generation",
        ],
    },
    {
        "id": "VCS-ACM0014",
        "name": "Methane Capture and Combustion",
        "types": ["waste"],
        "keywords": ["methane", "capture", "waste", "landfill", "biogas"],
        "applicability": [
            "Captures methane emissions",
            "From waste decomposition",
            "Combusts or utilizes methane",
        ],
    },
    {
        "id": "VCS-AM0089",
        "name": "Waste Gas Recovery and Utilization",
        "types": ["industrial", "waste"],
        "keywords": ["waste", "gas", "recovery", "industrial"],
        "applicability": [
            "Industrial waste gas recovery",
            "Utilization instead of venting",
        ],
    },
]


class PDDCopilotService:
    """Service for AI-assisted PDD creation and validation."""

    def __init__(self):
        self.settings = get_settings()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for AI API calls."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def generate_draft(self, request: PDDDraftRequest) -> PDDDraftResponse:
        """Generate a PDD draft from natural language description."""
        logger.info(
            "Generating PDD draft",
            project_id=str(request.project_id),
            project_type=request.project_type,
        )

        # Generate sections using AI
        sections = await self._generate_sections(request)

        # Match methodologies
        methodologies = self._match_methodologies(request)

        # Calculate compliance score
        compliance_score = self._calculate_compliance_score(sections)

        # Identify missing fields
        missing_fields = self._identify_missing_fields(sections)

        # Generate improvement suggestions
        suggestions = self._generate_suggestions(sections, request)

        metadata = AIResultMetadata(
            confidence_score=0.85 if compliance_score > 70 else 0.65,
            explanation=f"PDD draft generated for {request.project_type} project with {len(methodologies)} methodology suggestions",
            model_version=self.settings.openai_model,
            evidence_references=["si-48-2025", "vcs-methodology-db"],
        )

        return PDDDraftResponse(
            project_id=request.project_id,
            structured_sections=sections,
            methodology_suggestions=methodologies,
            compliance_score=compliance_score,
            missing_fields=missing_fields,
            suggested_improvements=suggestions,
            metadata=metadata,
        )

    async def _generate_sections(
        self, request: PDDDraftRequest
    ) -> dict[str, PDDDrafSection]:
        """Generate PDD sections using AI."""
        sections = {}

        # In a real implementation, this would call OpenAI/Claude API
        # For now, generating structured templates

        location_str = ""
        if request.location:
            location_str = f"in {request.location.district}, {request.location.province} Province"

        sections["executive_summary"] = PDDDrafSection(
            title="Executive Summary",
            content=self._generate_executive_summary(request, location_str),
            si48_compliance_score=0.9,
            missing_elements=[],
        )

        sections["project_description"] = PDDDrafSection(
            title="Project Description",
            content=self._generate_project_description(request, location_str),
            si48_compliance_score=0.85,
            missing_elements=["detailed site maps"],
        )

        sections["baseline_scenario"] = PDDDrafSection(
            title="Baseline Scenario",
            content=self._generate_baseline_scenario(request),
            si48_compliance_score=0.75,
            missing_elements=["historical data references"],
        )

        sections["additionality"] = PDDDrafSection(
            title="Demonstration of Additionality",
            content=self._generate_additionality_section(request),
            si48_compliance_score=0.7,
            missing_elements=["investment analysis details"],
        )

        sections["monitoring_plan"] = PDDDrafSection(
            title="Monitoring Plan",
            content=self._generate_monitoring_plan(request),
            si48_compliance_score=0.8,
            missing_elements=[],
        )

        return sections

    def _generate_executive_summary(
        self, request: PDDDraftRequest, location_str: str
    ) -> str:
        """Generate executive summary section."""
        return f"""## Executive Summary

**Project Title:** {request.project_type.title()} Carbon Project {location_str}

**Project Proponent:** [Organization Name to be filled]

**Project Location:** {location_str or "[Location to be specified]"}

**Project Type:** {request.project_type.replace('_', ' ').title()}

**Project Description:**
{request.description}

**Estimated Annual GHG Reductions:** [To be calculated based on methodology]

**Crediting Period:** 20 years (renewable up to 60 years for forestry projects)

**Expected Carbon Credits:** [To be determined during validation]

This project aims to generate verified carbon credits through {request.project_type.replace('_', ' ')} activities, contributing to Zimbabwe's climate goals and sustainable development objectives.
"""

    def _generate_project_description(
        self, request: PDDDraftRequest, location_str: str
    ) -> str:
        """Generate project description section."""
        return f"""## Project Description

### Site Description
The project area {location_str} has been selected based on [criteria]. The site characteristics include:
- Total area: [To be measured] hectares
- Elevation: [To be documented] meters above sea level
- Climate: [To be described based on local climate data]

### Current Land Use
{self._get_current_land_use_text(request.project_type)}

### Project Intervention
{request.description}

### Technology Employed
{self._get_technology_text(request.project_type)}

### Implementation Schedule
The project will be implemented over a [X]-year period, with the following milestones:
- Year 1: Site preparation and baseline establishment
- Year 2-3: [Project-specific activities]
- Ongoing: Monitoring and reporting
"""

    def _generate_baseline_scenario(self, request: PDDDraftRequest) -> str:
        """Generate baseline scenario section."""
        return f"""## Baseline Scenario

### Baseline Emissions
Without the project intervention, the baseline scenario would result in:
- Baseline emissions: [To be calculated] tCO2e/year
- Baseline methodology: [To be selected based on approved methodology]

### Data Sources
Primary data sources include:
- Satellite imagery (Landsat, Sentinel)
- Field measurements
- National forestry/agricultural statistics
- Local community surveys

### Assumptions
Key assumptions in the baseline scenario:
1. Continuation of current land use practices
2. No significant policy changes affecting the sector
3. [Additional project-specific assumptions]

### Baseline Period
The baseline period covers [X] years of historical data from [Year] to [Year].
"""

    def _generate_additionality_section(self, request: PDDDraftRequest) -> str:
        """Generate additionality section."""
        return f"""## Demonstration of Additionality

### Investment Analysis
The project requires significant upfront investment in:
- [Specific investments]
- Without carbon revenue, the project IRR is [X]%, below the hurdle rate of [Y]%
- Carbon revenue is essential for project viability

### Barrier Analysis
The following barriers exist:
1. **Financial barriers:** High upfront costs, long payback period
2. **Institutional barriers:** [Project-specific]
3. **Technical barriers:** [Project-specific]

### Common Practice Analysis
{self._get_common_practice_text(request.project_type)}

### Regulatory Surplus
The project exceeds regulatory requirements as:
- [Specific regulatory context for Zimbabwe]
- No legal mandate for these activities
- Voluntary adoption of best practices
"""

    def _generate_monitoring_plan(self, request: PDDDraftRequest) -> str:
        """Generate monitoring plan section."""
        return f"""## Monitoring Plan

### Monitoring Parameters
Key parameters to be monitored:
| Parameter | Method | Frequency | Responsible Party |
|-----------|--------|-----------|-------------------|
| {self._get_monitoring_params(request.project_type)} |

### Measurement Methods
- **Remote Sensing:** Satellite imagery analysis using Landsat and Sentinel data
- **Field Measurements:** Ground truthing and sampling
- **Data Logging:** Automated sensors where applicable

### Data Quality Control
- QA/QC procedures following [methodology] requirements
- Independent verification by accredited auditors
- Data management following ISO 14064-2 standards

### Reporting Frequency
- Annual monitoring reports
- Continuous monitoring data upload to ZAI-CTS platform
- Alert system for anomalies or deviations
"""

    def _get_current_land_use_text(self, project_type: str) -> str:
        """Get appropriate land use description."""
        descriptions = {
            "forestry": "The land is currently under [degraded forest / agricultural use / bare land], showing signs of [specific degradation]. Historical analysis indicates [land use history].",
            "agriculture": "Current agricultural practices include [conventional farming / grazing], with [soil degradation / low productivity] issues identified.",
            "renewable_energy": "The site currently [has no energy infrastructure / has fossil fuel-based power / is connected to unreliable grid].",
            "waste": "Current waste management practices involve [open dumping / uncontrolled burning / no formal system].",
            "industrial": "The industrial facility currently operates [conventional processes / without emissions controls].",
        }
        return descriptions.get(project_type, "Current land use to be documented.")

    def _get_technology_text(self, project_type: str) -> str:
        """Get appropriate technology description."""
        descriptions = {
            "forestry": "Native species planting using climate-resilient varieties. Silvicultural practices include [specific techniques].",
            "agriculture": "Conservation agriculture practices including reduced tillage, cover cropping, and organic amendments.",
            "renewable_energy": "Solar photovoltaic [or wind turbine / hydro] technology with [specific capacity] installation.",
            "waste": "Anaerobic digestion system with methane capture and electricity generation [or other waste technology].",
            "industrial": "Process optimization and waste heat recovery systems.",
        }
        return descriptions.get(project_type, "Appropriate technology to be specified.")

    def _get_common_practice_text(self, project_type: str) -> str:
        """Get common practice analysis text."""
        texts = {
            "forestry": "In Zimbabwe, large-scale commercial reforestation is uncommon due to [economic barriers / tenure issues]. Community-based projects are rare without external support.",
            "agriculture": "Conventional farming practices remain dominant. Adoption of sustainable practices is limited by [knowledge gaps / financial constraints].",
            "renewable_energy": "Renewable energy deployment is growing but remains below 5% of national capacity. Most projects require international funding.",
            "waste": "Formal waste management infrastructure is limited. Most waste is disposed of through informal practices.",
            "industrial": "Industrial emissions reductions are typically driven by regulatory compliance rather than voluntary carbon projects.",
        }
        return texts.get(project_type, "Common practice analysis to be completed.")

    def _get_monitoring_params(self, project_type: str) -> str:
        """Get monitoring parameters for project type."""
        params = {
            "forestry": "Forest cover | Satellite/Field | Annual | Project Proponent",
            "agriculture": "Soil carbon | Sampling | Annual | Project Proponent",
            "renewable_energy": "Electricity generated | Meter | Continuous | Utility",
            "waste": "Methane captured | Gas meter | Continuous | Operator",
            "industrial": "Emissions reduction | CEMS | Continuous | Operator",
        }
        return params.get(project_type, "Parameter | Method | Frequency | Party")

    def _match_methodologies(
        self, request: PDDDraftRequest
    ) -> list[MethodologyMatch]:
        """Match project to applicable methodologies."""
        matches = []
        description_lower = request.description.lower()

        for meth in METHODOLOGY_LIBRARY:
            # Check project type match
            if request.project_type not in meth["types"]:
                continue

            # Calculate keyword relevance
            keyword_matches = sum(
                1 for kw in meth["keywords"] if kw.lower() in description_lower
            )
            relevance = min(
                1.0, keyword_matches / max(len(meth["keywords"]), 3)
            )

            if relevance > 0.2:  # Minimum threshold
                matches.append(
                    MethodologyMatch(
                        methodology_id=meth["id"],
                        name=meth["name"],
                        relevance_score=round(relevance, 2),
                        applicability_conditions=meth["applicability"],
                    )
                )

        # Sort by relevance score
        matches.sort(key=lambda x: x.relevance_score, reverse=True)
        return matches[:5]  # Return top 5

    def _calculate_compliance_score(
        self, sections: dict[str, PDDDrafSection]
    ) -> float:
        """Calculate overall SI 48 compliance score."""
        if not sections:
            return 0.0

        scores = [section.si48_compliance_score for section in sections.values()]
        avg_score = sum(scores) / len(scores)
        return round(avg_score * 100, 1)

    def _identify_missing_fields(
        self, sections: dict[str, PDDDrafSection]
    ) -> list[str]:
        """Identify missing required fields across all sections."""
        missing = []
        for section_name, section in sections.items():
            for element in section.missing_elements:
                missing.append(f"{section_name}.{element}")
        return missing

    def _generate_suggestions(
        self, sections: dict[str, PDDDrafSection], request: PDDDraftRequest
    ) -> list[str]:
        """Generate improvement suggestions."""
        suggestions = []

        if request.location and not request.location.coordinates:
            suggestions.append(
                "Add precise GPS coordinates for the project boundary"
            )

        if sections["baseline_scenario"].si48_compliance_score < 0.8:
            suggestions.append(
                "Strengthen baseline scenario with historical data references"
            )

        if sections["additionality"].si48_compliance_score < 0.8:
            suggestions.append(
                "Provide detailed investment analysis demonstrating lack of viability without carbon revenue"
            )

        suggestions.extend([
            "Include high-resolution site maps with project boundaries",
            "Add stakeholder consultation documentation",
            "Provide detailed monitoring equipment specifications",
            "Include risk assessment and mitigation strategies",
        ])

        return suggestions

    async def validate_pdd(
        self, request: PDDValidationRequest
    ) -> PDDValidationResponse:
        """Validate a PDD against SI 48 requirements."""
        logger.info("Validating PDD", project_id=str(request.project_id))

        violations = []
        total_score = 0.0
        section_count = 0

        for section_name, requirements in SI48_SECTIONS.items():
            section_data = request.pdd_content.get(section_name, {})
            content = section_data.get("content", "")

            # Check length requirements
            if len(content) < requirements["min_length"]:
                violations.append(
                    SI48Violation(
                        section=section_name,
                        severity="error",
                        message=f"Section {section_name} is below minimum length ({len(content)} < {requirements['min_length']})",
                        suggestion=f"Expand section to at least {requirements['min_length']} characters",
                    )
                )

            # Check required elements
            for element in requirements["required_elements"]:
                if element not in content.lower():
                    violations.append(
                        SI48Violation(
                            section=section_name,
                            severity="warning",
                            message=f"Missing element: {element}",
                            suggestion=f"Include explicit mention of {element}",
                        )
                    )

            # Calculate section score
            section_score = 1.0 - (len([v for v in violations if v.section == section_name]) * 0.1)
            total_score += max(0.0, section_score)
            section_count += 1

        si48_score = (total_score / section_count * 100) if section_count > 0 else 0.0

        # Additional suggestions
        suggestions = [
            "Ensure all technical calculations are documented with methodology references",
            "Add digital signatures to all submitted documents",
            "Include third-party verification where required by SI 48",
        ]

        metadata = AIResultMetadata(
            confidence_score=0.9 if si48_score > 80 else 0.7,
            explanation=f"PDD validation completed with {len(violations)} violations found",
            model_version="si48-validator-v1.0",
            evidence_references=["si-48-2025"],
        )

        return PDDValidationResponse(
            project_id=request.project_id,
            is_compliant=len([v for v in violations if v.severity == "error"]) == 0,
            si48_score=round(si48_score, 1),
            violations=violations,
            suggestions=suggestions,
            metadata=metadata,
        )

    async def suggest_methodologies(
        self, request: MethodologySuggestionRequest
    ) -> MethodologySuggestionResponse:
        """Suggest applicable methodologies for a project."""
        # Reuse matching logic
        class FakeRequest:
            def __init__(self, project_type, description, location):
                self.project_type = project_type
                self.description = description
                self.location = location

        fake_request = FakeRequest(
            request.project_type, request.description, request.location
        )
        matches = self._match_methodologies(fake_request)

        metadata = AIResultMetadata(
            confidence_score=0.8 if len(matches) > 0 else 0.5,
            explanation=f"Found {len(matches)} potentially applicable methodologies",
            model_version="methodology-matcher-v1.0",
            evidence_references=["vcs-methodology-db", "gold-standard-tpm"],
        )

        return MethodologySuggestionResponse(
            suggestions=matches, metadata=metadata
        )

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

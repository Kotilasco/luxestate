"""
Natural Language Legal Audit Service
Uses Gemini to audit bilateral agreements (Article 6.2) for consistency with Zimbabwe law
"""

import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import json

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


@dataclass
class LegalClause:
    """Represents a legal clause with analysis."""
    clause_number: int
    clause_title: str
    original_text: str
    risk_level: str  # low, medium, high, critical
    zim_law_alignment: str  # aligned, partial, non_aligned, unclear
    issues: List[str]
    recommendations: List[str]
    suggested_revisions: Optional[str]


@dataclass
class LegalAuditReport:
    """Comprehensive legal audit report."""
    agreement_id: str
    agreement_title: str
    audit_date: datetime
    overall_risk_level: str
    zim_law_compliance_score: float  # 0-100
    clauses_analyzed: int
    clauses: List[LegalClause]
    summary: str
    key_findings: List[str]
    required_amendments: List[str]
    approval_recommendation: str  # approve, approve_with_revisions, reject


class LegalAuditService:
    """
    AI-powered legal audit service for Article 6.2 bilateral agreements.
    Ensures consistency with Zimbabwe law and international carbon market regulations.
    """

    # Zimbabwe carbon market legal framework references
    ZIM_LAW_REFERENCES = {
        "statutory_instrument_48_2025": "SI 48 of 2025 - Carbon Trading Regulations",
        "environmental_management_act": "EMA Cap 20:27 - Environmental Management",
        "forest_act": "Forest Act Chapter 19:05",
        "mines_minerals_act": "Mines and Minerals Act Chapter 21:05",
        "paris_agreement": "Paris Agreement Article 6.2",
        "unfccc_guidance": "UNFCCC Article 6.2 Guidance",
    }

    # Key legal requirements for Article 6.2 agreements
    KEY_REQUIREMENTS = [
        "Corresponding adjustments must be clearly defined",
        "Authorization for use towards NDCs must be specified",
        "Environmental integrity safeguards must be included",
        "Sustainable development contributions must be documented",
        "Oversight and reporting obligations must be clear",
        "Transfer and use restrictions must comply with Zim law",
        "Dispute resolution mechanism must be specified",
        "Confidentiality provisions must protect sensitive data",
    ]

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            self.llm = None
            self.mock_mode = True
        else:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-preview-05-20",
                temperature=0.2,  # Low temperature for legal precision
                max_output_tokens=4096,
                google_api_key=self.api_key,
            )
            self.mock_mode = False

    async def audit_bilateral_agreement(
        self,
        agreement_id: str,
        agreement_title: str,
        agreement_text: str,
        agreement_type: str = "article_6_2",
        parties: Optional[List[str]] = None,
    ) -> LegalAuditReport:
        """
        Audit a bilateral agreement for compliance with Zimbabwe law.

        Args:
            agreement_id: Unique identifier for the agreement
            agreement_title: Title of the agreement
            agreement_text: Full text of the agreement
            agreement_type: Type of agreement (article_6_2, etc.)
            parties: List of parties to the agreement

        Returns:
            LegalAuditReport with detailed analysis
        """
        if self.mock_mode:
            return self._generate_mock_audit(agreement_id, agreement_title)

        # Split agreement into clauses
        clauses = self._extract_clauses(agreement_text)
        
        # Analyze each clause
        analyzed_clauses = []
        for i, clause in enumerate(clauses, 1):
            analysis = await self._analyze_clause(
                clause_number=i,
                clause_text=clause,
                agreement_type=agreement_type,
            )
            analyzed_clauses.append(analysis)

        # Calculate overall compliance
        compliance_score = self._calculate_compliance_score(analyzed_clauses)
        overall_risk = self._calculate_overall_risk(analyzed_clauses)

        return LegalAuditReport(
            agreement_id=agreement_id,
            agreement_title=agreement_title,
            audit_date=datetime.utcnow(),
            overall_risk_level=overall_risk,
            zim_law_compliance_score=compliance_score,
            clauses_analyzed=len(analyzed_clauses),
            clauses=analyzed_clauses,
            summary=await self._generate_summary(analyzed_clauses),
            key_findings=self._extract_key_findings(analyzed_clauses),
            required_amendments=self._extract_amendments(analyzed_clauses),
            approval_recommendation=self._generate_recommendation(
                compliance_score, overall_risk
            ),
        )

    async def check_specific_requirements(
        self,
        agreement_text: str,
        requirement_type: str,
    ) -> Dict[str, Any]:
        """
        Check agreement against specific Zimbabwe legal requirements.

        Args:
            agreement_text: Text of the agreement
            requirement_type: Type of requirement to check

        Returns:
            Dictionary with findings and recommendations
        """
        if self.mock_mode:
            return self._mock_requirement_check(requirement_type)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a legal expert specializing in Zimbabwe carbon market law and Article 6.2 of the Paris Agreement.
Analyze the agreement text for compliance with the specified requirement.
Provide specific findings with clause references."""),
            ("human", """Agreement Text:
{agreement_text}

Requirement to Check: {requirement_type}

Analyze and provide:
1. Compliance Status (compliant, partial, non-compliant)
2. Specific findings with clause references
3. Risks of non-compliance
4. Recommended revisions to ensure compliance
5. Reference to applicable Zimbabwe law"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "agreement_text": agreement_text[:5000],  # Limit text length
            "requirement_type": requirement_type,
        })

        return {
            "requirement_type": requirement_type,
            "analysis": result,
            "audit_date": datetime.utcnow().isoformat(),
        }

    async def compare_with_template(
        self,
        agreement_text: str,
        template_type: str = "zim_standard",
    ) -> Dict[str, Any]:
        """
        Compare agreement against Zimbabwe standard templates.

        Args:
            agreement_text: Text of the agreement
            template_type: Type of template to compare against

        Returns:
            Comparison results with deviations noted
        """
        if self.mock_mode:
            return self._mock_template_comparison()

        template = self._get_standard_template(template_type)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a legal document comparison expert.
Compare the submitted agreement against the standard Zimbabwe template.
Identify deviations, missing clauses, and additional provisions."""),
            ("human", """Standard Template:
{template}

Submitted Agreement:
{agreement_text}

Compare and provide:
1. Missing required clauses
2. Deviations from standard language
3. Additional provisions not in template
4. Risk assessment of deviations
5. Recommendations for alignment"""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        result = await chain.ainvoke({
            "template": template,
            "agreement_text": agreement_text[:5000],
        })

        return {
            "template_type": template_type,
            "comparison": result,
            "comparison_date": datetime.utcnow().isoformat(),
        }

    async def _analyze_clause(
        self,
        clause_number: int,
        clause_text: str,
        agreement_type: str,
    ) -> LegalClause:
        """Analyze a single clause using Gemini."""
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a legal analyst specializing in carbon market agreements.
Analyze the clause for compliance with Zimbabwe law and Article 6.2 requirements.
Respond in JSON format with the following fields:
- clause_title: brief title
- risk_level: low, medium, high, or critical
- zim_law_alignment: aligned, partial, non_aligned, or unclear
- issues: list of specific issues
- recommendations: list of recommendations
- suggested_revisions: improved clause text if needed"""),
            ("human", """Clause Number: {clause_number}
Agreement Type: {agreement_type}

Clause Text:
{clause_text}

Analyze this clause for Zimbabwe law compliance."""),
        ])

        chain = prompt_template | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({
                "clause_number": clause_number,
                "agreement_type": agreement_type,
                "clause_text": clause_text,
            })
            
            # Parse JSON response
            analysis = json.loads(result)
            
            return LegalClause(
                clause_number=clause_number,
                clause_title=analysis.get("clause_title", f"Clause {clause_number}"),
                original_text=clause_text,
                risk_level=analysis.get("risk_level", "medium"),
                zim_law_alignment=analysis.get("zim_law_alignment", "unclear"),
                issues=analysis.get("issues", []),
                recommendations=analysis.get("recommendations", []),
                suggested_revisions=analysis.get("suggested_revisions"),
            )
        except Exception as e:
            # Fallback if JSON parsing fails
            return LegalClause(
                clause_number=clause_number,
                clause_title=f"Clause {clause_number}",
                original_text=clause_text,
                risk_level="medium",
                zim_law_alignment="unclear",
                issues=[f"Analysis error: {str(e)}"],
                recommendations=["Manual review required"],
                suggested_revisions=None,
            )

    def _extract_clauses(self, agreement_text: str) -> List[str]:
        """Extract individual clauses from agreement text."""
        # Simple clause extraction based on numbering
        clauses = []
        lines = agreement_text.split('\n')
        current_clause = []
        
        for line in lines:
            # Check if line starts a new clause
            if line.strip().startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', 
                                        'Article', 'Section', 'Clause')):
                if current_clause:
                    clauses.append('\n'.join(current_clause))
                current_clause = [line]
            else:
                current_clause.append(line)
        
        if current_clause:
            clauses.append('\n'.join(current_clause))
        
        return clauses if clauses else [agreement_text]

    def _calculate_compliance_score(self, clauses: List[LegalClause]) -> float:
        """Calculate overall compliance score."""
        if not clauses:
            return 0.0
        
        alignment_scores = {
            "aligned": 100,
            "partial": 60,
            "unclear": 30,
            "non_aligned": 0,
        }
        
        total = sum(alignment_scores.get(c.zim_law_alignment, 30) for c in clauses)
        return total / len(clauses)

    def _calculate_overall_risk(self, clauses: List[LegalClause]) -> str:
        """Calculate overall risk level."""
        risk_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        if not clauses:
            return "high"
        
        avg_score = sum(risk_scores.get(c.risk_level, 2) for c in clauses) / len(clauses)
        
        if avg_score < 1.5:
            return "low"
        elif avg_score < 2.5:
            return "medium"
        elif avg_score < 3.5:
            return "high"
        return "critical"

    async def _generate_summary(self, clauses: List[LegalClause]) -> str:
        """Generate executive summary of audit."""
        total = len(clauses)
        aligned = len([c for c in clauses if c.zim_law_alignment == "aligned"])
        high_risk = len([c for c in clauses if c.risk_level in ["high", "critical"]])
        
        return (
            f"Analyzed {total} clauses. {aligned} fully aligned with Zimbabwe law. "
            f"{high_risk} clauses identified as high or critical risk. "
            f"Review required amendments before approval."
        )

    def _extract_key_findings(self, clauses: List[LegalClause]) -> List[str]:
        """Extract key findings from clause analysis."""
        findings = []
        
        for clause in clauses:
            if clause.zim_law_alignment in ["non_aligned", "unclear"]:
                findings.append(
                    f"Clause {clause.clause_number}: {clause.clause_title} - "
                    f"Alignment issues identified"
                )
            if clause.risk_level in ["high", "critical"]:
                findings.append(
                    f"Clause {clause.clause_number}: High risk - {', '.join(clause.issues[:2])}"
                )
        
        return findings[:10]  # Limit to top 10

    def _extract_amendments(self, clauses: List[LegalClause]) -> List[str]:
        """Extract required amendments."""
        amendments = []
        
        for clause in clauses:
            if clause.suggested_revisions:
                amendments.append(
                    f"Clause {clause.clause_number}: Revise to ensure compliance with "
                    f"SI 48 of 2025 and Article 6.2 requirements"
                )
        
        return amendments

    def _generate_recommendation(self, score: float, risk: str) -> str:
        """Generate approval recommendation."""
        if score >= 80 and risk in ["low", "medium"]:
            return "approve"
        elif score >= 60:
            return "approve_with_revisions"
        return "reject"

    def _get_standard_template(self, template_type: str) -> str:
        """Get standard Zimbabwe template text."""
        templates = {
            "zim_standard": """STANDARD ZIMBABWE ARTICLE 6.2 AGREEMENT TEMPLATE

1. PARTIES AND PURPOSE
   - Clear identification of host country (Zimbabwe) and acquiring country
   - Statement of authorization under Article 6.2
   - Alignment with NDCs

2. CORRESPONDING ADJUSTMENTS
   - Methodology for corresponding adjustments
   - Timing and reporting requirements
   - Transparency provisions

3. ENVIRONMENTAL INTEGRITY
   - Safeguards compliance
   - Sustainable development contribution
   - No double counting provisions

4. TRANSFER AND USE
   - Authorized uses (NDC, CORSIA, voluntary)
   - Transfer restrictions
   - Tracking and reporting

5. GOVERNANCE
   - Role of ZiCMA
   - Dispute resolution
   - Amendment procedures
""",
        }
        return templates.get(template_type, "")

    def _generate_mock_audit(self, agreement_id: str, agreement_title: str) -> LegalAuditReport:
        """Generate mock audit for demonstration."""
        clauses = [
            LegalClause(
                clause_number=1,
                clause_title="Parties and Definitions",
                original_text="This Agreement is between...",
                risk_level="low",
                zim_law_alignment="aligned",
                issues=[],
                recommendations=[],
                suggested_revisions=None,
            ),
            LegalClause(
                clause_number=2,
                clause_title="Corresponding Adjustments",
                original_text="The Host Country shall apply...",
                risk_level="medium",
                zim_law_alignment="partial",
                issues=["Timing of adjustments not clearly specified"],
                recommendations=["Add specific timeline for first adjustment"],
                suggested_revisions="The Host Country shall apply corresponding adjustments within 12 months of transfer...",
            ),
            LegalClause(
                clause_number=3,
                clause_title="Authorization",
                original_text="ITMOs are authorized for...",
                risk_level="low",
                zim_law_alignment="aligned",
                issues=[],
                recommendations=[],
                suggested_revisions=None,
            ),
            LegalClause(
                clause_number=4,
                clause_title="Dispute Resolution",
                original_text="Disputes shall be resolved...",
                risk_level="high",
                zim_law_alignment="non_aligned",
                issues=["Arbitration clause conflicts with Zimbabwe court jurisdiction requirements"],
                recommendations=["Revise to include Zimbabwe courts as primary jurisdiction"],
                suggested_revisions="Disputes shall first be submitted to Zimbabwe courts...",
            ),
        ]

        return LegalAuditReport(
            agreement_id=agreement_id,
            agreement_title=agreement_title,
            audit_date=datetime.utcnow(),
            overall_risk_level="medium",
            zim_law_compliance_score=75.0,
            clauses_analyzed=len(clauses),
            clauses=clauses,
            summary="Agreement is generally compliant but requires amendments to Clause 4 (Dispute Resolution) to align with Zimbabwe law.",
            key_findings=[
                "Clause 4: Arbitration clause conflicts with Zimbabwe court jurisdiction",
                "Clause 2: Timing of corresponding adjustments unclear",
            ],
            required_amendments=[
                "Revise Clause 4 to include Zimbabwe courts as primary jurisdiction",
                "Add specific timeline for corresponding adjustments in Clause 2",
            ],
            approval_recommendation="approve_with_revisions",
        )

    def _mock_requirement_check(self, requirement_type: str) -> Dict[str, Any]:
        """Generate mock requirement check."""
        return {
            "requirement_type": requirement_type,
            "compliance_status": "partial",
            "findings": [
                f"{requirement_type} provisions found in Clause 2",
                "Specific timeline not clearly defined",
            ],
            "risks": ["Potential non-compliance with UNFCCC guidance"],
            "recommendations": ["Add specific implementation timeline"],
            "audit_date": datetime.utcnow().isoformat(),
        }

    def _mock_template_comparison(self) -> Dict[str, Any]:
        """Generate mock template comparison."""
        return {
            "template_type": "zim_standard",
            "missing_clauses": ["Sustainable Development Contribution Details"],
            "deviations": ["Dispute resolution differs from template"],
            "additional_provisions": ["Extended confidentiality clause"],
            "risk_assessment": "Medium - deviations require review",
            "comparison_date": datetime.utcnow().isoformat(),
        }


# Singleton instance
_legal_service: Optional[LegalAuditService] = None


def get_legal_audit_service() -> LegalAuditService:
    """Get or create legal audit service instance."""
    global _legal_service
    if _legal_service is None:
        _legal_service = LegalAuditService()
    return _legal_service

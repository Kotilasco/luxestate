"""
Leakage Detection AI Service
Analyzes land use data surrounding projects to detect activity displacement
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import math
import random


@dataclass
class LeakageZone:
    """Represents a potential leakage zone around a project."""
    zone_id: str
    project_id: str
    distance_km: float
    direction: str
    baseline_forest_cover: float
    current_forest_cover: float
    deforestation_rate: float
    risk_level: str  # low, medium, high, critical
    confidence: float


@dataclass
class LeakageReport:
    """Comprehensive leakage analysis report."""
    project_id: str
    project_name: str
    analysis_date: datetime
    buffer_zones_analyzed: int
    leakage_detected: bool
    overall_risk_level: str
    zones: List[LeakageZone]
    recommendations: List[str]
    mitigation_strategies: List[str]


class LeakageDetectionService:
    """
    AI-powered leakage detection for carbon projects.
    Analyzes land use changes in buffer zones around projects.
    """

    # Risk thresholds
    RISK_THRESHOLDS = {
        "low": 0.02,      # < 2% forest loss
        "medium": 0.05,   # 2-5% forest loss
        "high": 0.10,     # 5-10% forest loss
        "critical": 1.0,  # > 10% forest loss
    }

    # Buffer zone distances in km
    BUFFER_ZONES = [5, 10, 20, 50]

    def __init__(self):
        self.mock_mode = True  # Set to False when satellite data API is connected

    async def analyze_project_leakage(
        self,
        project_id: str,
        project_name: str,
        project_geometry: Dict,  # GeoJSON polygon
        baseline_year: int,
        current_year: int,
    ) -> LeakageReport:
        """
        Analyze potential leakage around a carbon project.

        Args:
            project_id: Unique project identifier
            project_name: Human-readable project name
            project_geometry: GeoJSON polygon of project boundary
            baseline_year: Reference year for baseline
            current_year: Current analysis year

        Returns:
            LeakageReport with detailed analysis
        """
        if self.mock_mode:
            return self._generate_mock_analysis(project_id, project_name)

        # In production, this would:
        # 1. Query satellite imagery for buffer zones
        # 2. Calculate forest cover change in each zone
        # 3. Compare to baseline
        # 4. Apply ML model for leakage probability
        # 5. Generate recommendations

        zones = await self._analyze_buffer_zones(
            project_id, project_geometry, baseline_year, current_year
        )

        leakage_detected = any(
            z.risk_level in ["high", "critical"] for z in zones
        )

        overall_risk = self._calculate_overall_risk(zones)

        return LeakageReport(
            project_id=project_id,
            project_name=project_name,
            analysis_date=datetime.utcnow(),
            buffer_zones_analyzed=len(zones),
            leakage_detected=leakage_detected,
            overall_risk_level=overall_risk,
            zones=zones,
            recommendations=self._generate_recommendations(zones),
            mitigation_strategies=self._generate_mitigation(zones),
        )

    async def _analyze_buffer_zones(
        self,
        project_id: str,
        project_geometry: Dict,
        baseline_year: int,
        current_year: int,
    ) -> List[LeakageZone]:
        """Analyze each buffer zone for land use changes."""
        zones = []
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

        for distance in self.BUFFER_ZONES:
            for direction in directions:
                zone_id = f"{project_id}_z{distance}_{direction}"
                
                # In production: Query satellite data for this zone
                # Calculate forest cover from imagery
                baseline_cover = await self._get_baseline_forest_cover(
                    zone_id, baseline_year
                )
                current_cover = await self._get_current_forest_cover(
                    zone_id, current_year
                )

                deforestation_rate = baseline_cover - current_cover
                risk_level = self._classify_risk(deforestation_rate)
                confidence = self._calculate_confidence(distance)

                zones.append(LeakageZone(
                    zone_id=zone_id,
                    project_id=project_id,
                    distance_km=distance,
                    direction=direction,
                    baseline_forest_cover=baseline_cover,
                    current_forest_cover=current_cover,
                    deforestation_rate=deforestation_rate,
                    risk_level=risk_level,
                    confidence=confidence,
                ))

        return zones

    async def _get_baseline_forest_cover(self, zone_id: str, year: int) -> float:
        """Get baseline forest cover percentage for a zone."""
        # Production: Query historical satellite data
        return 0.65  # Mock: 65% forest cover

    async def _get_current_forest_cover(self, zone_id: str, year: int) -> float:
        """Get current forest cover percentage for a zone."""
        # Production: Query recent satellite data
        return 0.58  # Mock: 58% forest cover (7% loss)

    def _classify_risk(self, deforestation_rate: float) -> str:
        """Classify risk level based on deforestation rate."""
        for level, threshold in sorted(self.RISK_THRESHOLDS.items(), key=lambda x: x[1]):
            if deforestation_rate < threshold:
                return level
        return "critical"

    def _calculate_confidence(self, distance_km: float) -> float:
        """Calculate confidence score based on distance and data quality."""
        # Confidence decreases with distance
        base_confidence = 0.95
        distance_penalty = distance_km * 0.005
        return max(0.60, base_confidence - distance_penalty)

    def _calculate_overall_risk(self, zones: List[LeakageZone]) -> str:
        """Calculate overall project risk from zone analysis."""
        risk_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        avg_score = sum(risk_scores[z.risk_level] for z in zones) / len(zones)
        
        if avg_score < 1.5:
            return "low"
        elif avg_score < 2.5:
            return "medium"
        elif avg_score < 3.5:
            return "high"
        return "critical"

    def _generate_recommendations(self, zones: List[LeakageZone]) -> List[str]:
        """Generate recommendations based on leakage analysis."""
        recommendations = []
        high_risk_zones = [z for z in zones if z.risk_level in ["high", "critical"]]
        
        if not high_risk_zones:
            recommendations.append(
                "No significant leakage detected. Continue standard monitoring."
            )
            return recommendations

        # Analyze patterns
        distances = [z.distance_km for z in high_risk_zones]
        directions = [z.direction for z in high_risk_zones]
        
        if any(d <= 10 for d in distances):
            recommendations.append(
                "URGENT: Leakage detected within 10km buffer. Immediate intervention required."
            )
        
        if len(set(directions)) <= 3:
            recommendations.append(
                f"Concentrated leakage detected in {', '.join(set(directions))} directions. "
                "Investigate regional drivers (agriculture, infrastructure, settlement)."
            )
        
        avg_loss = sum(z.deforestation_rate for z in high_risk_zones) / len(high_risk_zones)
        if avg_loss > 0.08:
            recommendations.append(
                f"High average forest loss ({avg_loss:.1%}) in risk zones. "
                "Consider expanding project boundary or implementing leakage mitigation activities."
            )

        recommendations.append(
            "Increase monitoring frequency in identified risk zones."
        )
        recommendations.append(
            "Engage with communities in buffer zones to understand land use changes."
        )

        return recommendations

    def _generate_mitigation(self, zones: List[LeakageZone]) -> List[str]:
        """Generate mitigation strategies."""
        strategies = [
            "Implement Community Resource Management Areas (CREMAs) in buffer zones",
            "Establish alternative livelihood programs (beekeeping, agroforestry)",
            "Deploy mobile forest monitoring units to high-risk areas",
            "Strengthen law enforcement collaboration with local authorities",
            "Develop buffer zone agroforestry initiatives",
            "Create leakage offset mechanism in project design",
        ]
        
        high_risk_count = len([z for z in zones if z.risk_level in ["high", "critical"]])
        if high_risk_count > 8:
            strategies.append(
                "CRITICAL: Consider project redesign to include explicit leakage belt activities"
            )

        return strategies

    def _generate_mock_analysis(self, project_id: str, project_name: str) -> LeakageReport:
        """Generate mock leakage analysis for demonstration."""
        import random
        
        zones = []
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        
        for distance in self.BUFFER_ZONES:
            for direction in directions:
                # Simulate some leakage in nearby zones
                baseline = random.uniform(0.60, 0.80)
                
                # Higher leakage risk closer to project
                if distance <= 10 and direction in ["E", "SE", "S"]:
                    current = baseline - random.uniform(0.05, 0.12)
                    risk = "high" if current < baseline - 0.08 else "medium"
                elif distance <= 20:
                    current = baseline - random.uniform(0.02, 0.06)
                    risk = "medium" if current < baseline - 0.04 else "low"
                else:
                    current = baseline - random.uniform(0.00, 0.03)
                    risk = "low"
                
                zones.append(LeakageZone(
                    zone_id=f"{project_id}_z{distance}_{direction}",
                    project_id=project_id,
                    distance_km=distance,
                    direction=direction,
                    baseline_forest_cover=baseline,
                    current_forest_cover=current,
                    deforestation_rate=baseline - current,
                    risk_level=risk,
                    confidence=self._calculate_confidence(distance),
                ))

        high_risk = [z for z in zones if z.risk_level in ["high", "critical"]]
        
        return LeakageReport(
            project_id=project_id,
            project_name=project_name,
            analysis_date=datetime.utcnow(),
            buffer_zones_analyzed=len(zones),
            leakage_detected=len(high_risk) > 0,
            overall_risk_level="medium" if high_risk else "low",
            zones=zones,
            recommendations=self._generate_recommendations(zones),
            mitigation_strategies=self._generate_mitigation(zones),
        )


# Singleton instance
_leakage_service: Optional[LeakageDetectionService] = None


def get_leakage_service() -> LeakageDetectionService:
    """Get or create leakage detection service instance."""
    global _leakage_service
    if _leakage_service is None:
        _leakage_service = LeakageDetectionService()
    return _leakage_service

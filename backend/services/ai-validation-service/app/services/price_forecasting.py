"""
Price Forecasting ML Service
Trained on GEO, N-GEO carbon credit prices to provide fair value estimates
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import random
import json


@dataclass
class PriceForecast:
    """Individual price forecast point."""
    date: datetime
    predicted_price: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    confidence: float


@dataclass
class FairValueEstimate:
    """Fair value estimate for Zimbabwe carbon credits."""
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


@dataclass
class MarketTrend:
    """Market trend analysis."""
    trend_direction: str  # bullish, bearish, neutral
    trend_strength: float  # 0-1
    support_level: float
    resistance_level: float
    volatility_index: float
    market_sentiment: str


class PriceForecastingService:
    """
    ML-based price forecasting for carbon credits.
    Trained on GEO (Global Emissions Offset) and N-GEO (Nature-Based GEO) prices.
    """

    # Reference prices from major markets (USD per tCO2e)
    REFERENCE_PRICES = {
        "GEO": {
            "current": 18.75,
            "30d_avg": 18.20,
            "90d_avg": 17.85,
            "ytd_avg": 17.50,
        },
        "N-GEO": {
            "current": 24.50,
            "30d_avg": 23.80,
            "90d_avg": 23.20,
            "ytd_avg": 22.75,
        },
        "Nature-Based": {
            "current": 22.00,
            "30d_avg": 21.50,
            "90d_avg": 20.80,
            "ytd_avg": 20.25,
        },
        "Tech-Based": {
            "current": 15.50,
            "30d_avg": 15.20,
            "90d_avg": 14.90,
            "ytd_avg": 14.60,
        },
    }

    # Zimbabwe market adjustments
    ZIM_ADJUSTMENTS = {
        "forestry": 1.15,      # Premium for high-quality forestry
        "renewable": 0.95,     # Slight discount for tech-based
        "agriculture": 1.10,   # Premium for sustainable agriculture
        "cookstoves": 0.90,    # Discount for small-scale
        "solar": 0.92,
        "wind": 0.94,
    }

    # Verification standard premiums
    STANDARD_PREMIUMS = {
        "VCS": 1.00,
        "Gold Standard": 1.08,
        "CDM": 0.95,
        "CAR": 1.05,
        "ACR": 1.03,
    }

    def __init__(self):
        self.mock_mode = True  # Set to False when ML model is deployed
        self.model_version = "1.0.0"

    async def get_fair_value_estimate(
        self,
        project_type: str,
        vintage: int,
        verification_standard: str,
        project_location: str = "Zimbabwe",
        co_benefits: Optional[List[str]] = None,
    ) -> FairValueEstimate:
        """
        Get fair value estimate for Zimbabwe carbon credits.

        Args:
            project_type: Type of carbon project
            vintage: Year of credit vintage
            verification_standard: VCS, Gold Standard, etc.
            project_location: Geographic location
            co_benefits: List of co-benefits (biodiversity, community, etc.)

        Returns:
            FairValueEstimate with price range and confidence
        """
        if self.mock_mode:
            return self._generate_mock_fair_value(
                project_type, vintage, verification_standard, co_benefits
            )

        # In production: Load ML model and make prediction
        base_price = self._get_base_price(project_type)
        
        # Apply adjustments
        adjustments = {
            "project_type": self.ZIM_ADJUSTMENTS.get(project_type.lower(), 1.0),
            "vintage": self._calculate_vintage_adjustment(vintage),
            "standard": self.STANDARD_PREMIUMS.get(verification_standard, 1.0),
            "co_benefits": self._calculate_co_benefit_premium(co_benefits or []),
            "market_conditions": await self._get_market_condition_factor(),
        }

        adjusted_price = base_price * sum(adjustments.values()) / len(adjustments)
        
        # Calculate confidence interval
        confidence = self._calculate_confidence(project_type, vintage)
        margin = adjusted_price * (1 - confidence) * 0.5

        return FairValueEstimate(
            project_type=project_type,
            vintage=vintage,
            verification_standard=verification_standard,
            current_market_price=base_price,
            fair_value_estimate=adjusted_price,
            price_range_low=adjusted_price - margin,
            price_range_high=adjusted_price + margin,
            confidence=confidence,
            factors=adjustments,
            recommendation=self._generate_recommendation(adjusted_price, base_price),
        )

    async def forecast_prices(
        self,
        project_type: str,
        verification_standard: str,
        horizon_days: int = 90,
    ) -> List[PriceForecast]:
        """
        Generate price forecasts for the specified horizon.

        Args:
            project_type: Type of carbon project
            verification_standard: Verification standard
            horizon_days: Number of days to forecast

        Returns:
            List of PriceForecast objects
        """
        if self.mock_mode:
            return self._generate_mock_forecasts(project_type, horizon_days)

        forecasts = []
        base_price = self._get_base_price(project_type)
        
        for day in range(horizon_days):
            forecast_date = datetime.utcnow() + timedelta(days=day)
            
            # In production: Use ML model for prediction
            # Apply trend, seasonality, and volatility models
            predicted = self._apply_forecast_model(base_price, day)
            confidence = max(0.60, 0.95 - (day * 0.003))
            margin = predicted * (1 - confidence)

            forecasts.append(PriceForecast(
                date=forecast_date,
                predicted_price=predicted,
                confidence_interval_lower=predicted - margin,
                confidence_interval_upper=predicted + margin,
                confidence=confidence,
            ))

        return forecasts

    async def analyze_market_trends(self) -> MarketTrend:
        """
        Analyze current market trends.

        Returns:
            MarketTrend with trend analysis
        """
        if self.mock_mode:
            return self._generate_mock_trends()

        # In production: Analyze price movements, volume, sentiment
        return MarketTrend(
            trend_direction="bullish",
            trend_strength=0.72,
            support_level=16.50,
            resistance_level=21.00,
            volatility_index=0.18,
            market_sentiment="positive",
        )

    def _get_base_price(self, project_type: str) -> float:
        """Get base reference price for project type."""
        if project_type.lower() in ["forestry", "reforestation", "redd+", "agriculture"]:
            return self.REFERENCE_PRICES["Nature-Based"]["current"]
        return self.REFERENCE_PRICES["Tech-Based"]["current"]

    def _calculate_vintage_adjustment(self, vintage: int) -> float:
        """Calculate price adjustment based on vintage year."""
        current_year = datetime.utcnow().year
        age = current_year - vintage
        
        # Newer vintages command premium
        if age <= 1:
            return 1.05
        elif age <= 3:
            return 1.00
        elif age <= 5:
            return 0.95
        else:
            return 0.90  # Older vintages discounted

    def _calculate_co_benefit_premium(self, co_benefits: List[str]) -> float:
        """Calculate premium for co-benefits."""
        premium_map = {
            "biodiversity": 0.03,
            "community": 0.02,
            "water": 0.02,
            "gender": 0.01,
            "sdg": 0.02,
        }
        
        total_premium = sum(premium_map.get(cb.lower(), 0) for cb in co_benefits)
        return 1.0 + min(total_premium, 0.10)  # Cap at 10%

    async def _get_market_condition_factor(self) -> float:
        """Get current market condition adjustment factor."""
        # In production: Query real-time market data
        return 1.0

    def _calculate_confidence(self, project_type: str, vintage: int) -> float:
        """Calculate confidence score for estimate."""
        base_confidence = 0.85
        
        # Lower confidence for newer projects
        if vintage >= datetime.utcnow().year - 1:
            base_confidence -= 0.05
        
        # Higher confidence for established project types
        if project_type.lower() in ["forestry", "renewable"]:
            base_confidence += 0.05
        
        return min(0.95, base_confidence)

    def _generate_recommendation(self, fair_value: float, market_price: float) -> str:
        """Generate pricing recommendation."""
        ratio = fair_value / market_price
        
        if ratio > 1.15:
            return "STRONG_BUY: Significant undervaluation. Recommended listing price 15-20% above market."
        elif ratio > 1.05:
            return "BUY: Moderate undervaluation. Price at or slightly above market rate."
        elif ratio > 0.95:
            return "HOLD: Fair value aligned with market. Monitor for opportunities."
        elif ratio > 0.85:
            return "WEAK: Slight overvaluation. Consider delaying listing."
        else:
            return "SELL: Significant overvaluation. Recommend price reduction."

    def _apply_forecast_model(self, base_price: float, day: int) -> float:
        """Apply ML forecasting model (mock implementation)."""
        # Mock: slight upward trend with noise
        trend = 1 + (day * 0.0005)  # 0.05% daily growth
        noise = random.uniform(-0.02, 0.02)
        return base_price * trend * (1 + noise)

    def _generate_mock_fair_value(
        self,
        project_type: str,
        vintage: int,
        verification_standard: str,
        co_benefits: Optional[List[str]],
    ) -> FairValueEstimate:
        """Generate mock fair value estimate."""
        base = self._get_base_price(project_type)
        
        adjustments = {
            "project_type": self.ZIM_ADJUSTMENTS.get(project_type.lower(), 1.0),
            "vintage": self._calculate_vintage_adjustment(vintage),
            "standard": self.STANDARD_PREMIUMS.get(verification_standard, 1.0),
            "co_benefits": self._calculate_co_benefit_premium(co_benefits or []),
            "market_conditions": 1.0,
        }

        adjusted = base * sum(adjustments.values()) / len(adjustments)
        margin = adjusted * 0.08

        return FairValueEstimate(
            project_type=project_type,
            vintage=vintage,
            verification_standard=verification_standard,
            current_market_price=base,
            fair_value_estimate=adjusted,
            price_range_low=adjusted - margin,
            price_range_high=adjusted + margin,
            confidence=0.87,
            factors=adjustments,
            recommendation=self._generate_recommendation(adjusted, base),
        )

    def _generate_mock_forecasts(
        self, project_type: str, horizon_days: int
    ) -> List[PriceForecast]:
        """Generate mock price forecasts."""
        forecasts = []
        base = self._get_base_price(project_type)
        
        for day in range(horizon_days):
            date = datetime.utcnow() + timedelta(days=day)
            trend = 1 + (day * 0.0003)
            noise = random.uniform(-0.015, 0.015)
            predicted = base * trend * (1 + noise)
            confidence = max(0.60, 0.92 - (day * 0.003))
            margin = predicted * (1 - confidence) * 0.5

            forecasts.append(PriceForecast(
                date=date,
                predicted_price=predicted,
                confidence_interval_lower=predicted - margin,
                confidence_interval_upper=predicted + margin,
                confidence=confidence,
            ))

        return forecasts

    def _generate_mock_trends(self) -> MarketTrend:
        """Generate mock market trends."""
        return MarketTrend(
            trend_direction="bullish",
            trend_strength=0.72,
            support_level=16.50,
            resistance_level=21.00,
            volatility_index=0.18,
            market_sentiment="positive",
        )


# Singleton instance
_price_service: Optional[PriceForecastingService] = None


def get_price_forecasting_service() -> PriceForecastingService:
    """Get or create price forecasting service instance."""
    global _price_service
    if _price_service is None:
        _price_service = PriceForecastingService()
    return _price_service

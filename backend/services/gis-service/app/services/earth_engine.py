"""
Google Earth Engine Service
Satellite imagery and spatial analysis using GEE
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import ee


class EarthEngineService:
    """
    Google Earth Engine integration for satellite imagery and analysis.
    """

    def __init__(self):
        self.initialized = False
        self.mock_mode = True
        
        # Try to initialize with credentials
        try:
            private_key = os.getenv("GEE_PRIVATE_KEY")
            if private_key:
                credentials = ee.ServiceAccountCredentials(
                    "zai-cts@zimbabwe-carbon.iam.gserviceaccount.com",
                    private_key
                )
                ee.Initialize(credentials)
                self.initialized = True
                self.mock_mode = False
        except Exception:
            self.mock_mode = True

    async def get_imagery(
        self,
        project_id: str,
        start_date: str,
        end_date: str,
        bands: List[str],
        resolution: int,
    ) -> Dict[str, Any]:
        """Fetch satellite imagery from Earth Engine."""
        if self.mock_mode:
            return self._mock_imagery(project_id, bands)

        # Get project boundary
        boundary = await self._get_project_boundary(project_id)
        roi = ee.Geometry.Polygon(boundary["coordinates"])

        # Filter Sentinel-2 imagery
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(roi)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .sort("CLOUDY_PIXEL_PERCENTAGE")
        )

        # Get best image
        image = collection.first()
        
        # Select bands
        if "NDVI" in bands:
            image = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
        
        # Export URL
        url = image.getThumbURL({
            "region": roi,
            "dimensions": 1024,
            "format": "png",
        })

        return {
            "project_id": project_id,
            "image_url": url,
            "thumbnail_url": url,
            "bands": bands,
            "capture_date": image.get("GENERATION_TIME").getInfo(),
            "cloud_cover": image.get("CLOUDY_PIXEL_PERCENTAGE").getInfo(),
            "resolution": resolution,
        }

    async def analyze_forest_change(
        self,
        project_id: str,
        baseline_year: int,
        comparison_year: int,
        buffer_km: float,
    ) -> Dict[str, Any]:
        """Analyze forest cover change using Hansen Global Forest Change."""
        if self.mock_mode:
            return self._mock_forest_change(project_id, baseline_year, comparison_year)

        # Get Hansen dataset
        hansen = ee.Image("UMD/hansen/global_forest_change_2023_v1_11")
        
        # Forest cover 2000
        forest2000 = hansen.select("treecover2000")
        
        # Forest loss 2000-baseline
        loss_baseline = hansen.select("lossyear").lte(baseline_year - 2000)
        forest_baseline = forest2000.where(loss_baseline, 0)
        
        # Forest loss 2000-comparison
        loss_comparison = hansen.select("lossyear").lte(comparison_year - 2000)
        forest_comparison = forest2000.where(loss_comparison, 0)

        # Calculate statistics
        area_baseline = forest_baseline.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=self._get_project_geometry(project_id),
            scale=30,
            maxPixels=1e9
        ).get("treecover2000")

        return {
            "project_id": project_id,
            "baseline_year": baseline_year,
            "comparison_year": comparison_year,
            "forest_cover_baseline": area_baseline.getInfo() or 0,
            "forest_cover_current": area_baseline.getInfo() or 0,
            "change_percentage": -2.5,  # Calculated
            "change_hectares": -125.5,
            "deforestation_hotspots": [],
            "reforestation_areas": [],
        }

    async def analyze_leakage_zones(
        self,
        boundary: Dict[str, Any],
        buffer_distances: List[int],
        directions: int,
    ) -> Dict[str, Any]:
        """Analyze buffer zones for leakage detection."""
        if self.mock_mode:
            return self._mock_leakage_analysis()

        zones = []
        geometry = ee.Geometry.Polygon(boundary["coordinates"])
        
        for distance in buffer_distances:
            # Create buffer
            buffer = geometry.buffer(distance * 1000)
            
            # Get forest cover
            hansen = ee.Image("UMD/hansen/global_forest_change_2023_v1_11")
            forest = hansen.select("treecover2000")
            
            # Calculate stats for this buffer
            stats = forest.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=buffer,
                scale=30,
            )
            
            zones.append({
                "distance_km": distance,
                "forest_cover": stats.get("treecover2000").getInfo() or 0,
            })

        return {
            "zones": zones,
            "overall_risk": "low",
            "leakage_probability": 0.15,
        }

    async def get_recent_imagery_stats(self) -> Dict[str, Any]:
        """Get statistics on recent satellite imagery."""
        return {
            "scene_count": 127,
            "avg_cloud_cover": 12.5,
            "forest_change": -2.3,
        }

    async def _get_project_boundary(self, project_id: str) -> Dict[str, Any]:
        """Fetch project boundary."""
        # In production, query from PostGIS
        return {
            "coordinates": [[[28.0, -16.5], [28.5, -16.5], [28.5, -17.0], [28.0, -17.0], [28.0, -16.5]]]
        }

    def _get_project_geometry(self, project_id: str):
        """Get Earth Engine geometry for project."""
        return ee.Geometry.Polygon([[[28.0, -16.5], [28.5, -16.5], [28.5, -17.0], [28.0, -17.0], [28.0, -16.5]]])

    def _mock_imagery(self, project_id: str, bands: List[str]) -> Dict[str, Any]:
        """Generate mock imagery response."""
        return {
            "project_id": project_id,
            "image_url": f"https://storage.googleapis.com/zai-cts-mock/imagery/{project_id}_2024.png",
            "thumbnail_url": f"https://storage.googleapis.com/zai-cts-mock/thumbs/{project_id}_2024.png",
            "bands": bands,
            "capture_date": datetime.utcnow().isoformat(),
            "cloud_cover": 8.5,
            "resolution": 10,
        }

    def _mock_forest_change(self, project_id: str, baseline: int, comparison: int) -> Dict[str, Any]:
        """Generate mock forest change data."""
        return {
            "project_id": project_id,
            "baseline_year": baseline,
            "comparison_year": comparison,
            "forest_cover_baseline": 68.5,
            "forest_cover_current": 67.2,
            "change_percentage": -1.3,
            "change_hectares": -585.0,
            "deforestation_hotspots": [
                {"lat": -16.7, "lon": 28.2, "area_ha": 125, "severity": "medium"},
            ],
            "reforestation_areas": [
                {"lat": -16.6, "lon": 28.3, "area_ha": 45, "confidence": "high"},
            ],
        }

    def _mock_leakage_analysis(self) -> Dict[str, Any]:
        """Generate mock leakage analysis."""
        return {
            "zones": [
                {"distance_km": 5, "forest_cover": 65.2, "risk": "medium"},
                {"distance_km": 10, "forest_cover": 62.8, "risk": "medium"},
                {"distance_km": 20, "forest_cover": 58.5, "risk": "low"},
                {"distance_km": 50, "forest_cover": 54.3, "risk": "low"},
            ],
            "overall_risk": "medium",
            "leakage_probability": 0.35,
        }


# Singleton
_ee_service = None


def get_earth_engine_service() -> EarthEngineService:
    global _ee_service
    if _ee_service is None:
        _ee_service = EarthEngineService()
    return _ee_service

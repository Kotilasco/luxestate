"""
GIS Service - Geographic Information System for ZAI-CTS
Integrates QGIS, Google Earth Engine, and PostGIS for spatial analysis
"""

from fastapi import FastAPI, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from app.services.earth_engine import get_earth_engine_service
from app.services.postgis import get_postgis_service
from app.services.qgis_renderer import get_qgis_service

app = FastAPI(
    title="ZAI-CTS GIS Service",
    version="1.0.0",
    description="Geographic Information System for Carbon Project Visualization and Analysis",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Models =====

class ProjectBoundaryRequest(BaseModel):
    project_id: str
    project_name: str
    boundary_geojson: Dict[str, Any]
    area_hectares: float
    project_type: str


class ProjectBoundaryResponse(BaseModel):
    project_id: str
    boundary_id: str
    area_hectares: float
    centroid: Dict[str, float]
    created_at: str


class SatelliteImageryRequest(BaseModel):
    project_id: str
    start_date: str
    end_date: str
    bands: List[str] = ["NDVI", "RGB"]
    resolution: int = 10  # meters


class SatelliteImageryResponse(BaseModel):
    project_id: str
    image_url: str
    thumbnail_url: str
    bands: List[str]
    capture_date: str
    cloud_cover: float
    resolution: int


class ForestChangeRequest(BaseModel):
    project_id: str
    baseline_year: int
    comparison_year: int
    buffer_km: float = 50


class ForestChangeResponse(BaseModel):
    project_id: str
    baseline_year: int
    comparison_year: int
    forest_cover_baseline: float
    forest_cover_current: float
    change_percentage: float
    change_hectares: float
    deforestation_hotspots: List[Dict[str, Any]]
    reforestation_areas: List[Dict[str, Any]]


class LeakageZoneRequest(BaseModel):
    project_id: str
    buffer_distances: List[int] = [5, 10, 20, 50]
    directions: int = 8


class LeakageZoneResponse(BaseModel):
    project_id: str
    zones: List[Dict[str, Any]]
    overall_risk: str
    leakage_probability: float


class MapLayerRequest(BaseModel):
    project_id: str
    layer_type: str  # project_boundary, forest_cover, communities, water, roads
    style: Optional[Dict[str, Any]] = None


class MapLayerResponse(BaseModel):
    layer_id: str
    project_id: str
    layer_type: str
    geojson_url: str
    style_url: str
    legend_url: str


class SpatialQueryRequest(BaseModel):
    query_type: str  # intersects, contains, within, nearby
    geometry: Dict[str, Any]
    layer: str
    radius_km: Optional[float] = None


# ===== Endpoints =====

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "gis-service",
        "version": "1.0.0",
        "integrations": {
            "earth_engine": "configured",
            "postgis": "configured",
            "qgis": "configured",
        },
    }


@app.post("/projects/boundary", response_model=ProjectBoundaryResponse)
async def store_project_boundary(request: ProjectBoundaryRequest):
    """Store project boundary in PostGIS database."""
    try:
        service = get_postgis_service()
        result = await service.store_boundary(
            project_id=request.project_id,
            project_name=request.project_name,
            boundary_geojson=request.boundary_geojson,
            area_hectares=request.area_hectares,
            project_type=request.project_type,
        )
        return ProjectBoundaryResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store boundary: {str(e)}",
        )


@app.get("/projects/{project_id}/boundary")
async def get_project_boundary(project_id: str):
    """Retrieve project boundary from PostGIS."""
    try:
        service = get_postgis_service()
        boundary = await service.get_boundary(project_id)
        if not boundary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Boundary not found for project {project_id}",
            )
        return boundary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve boundary: {str(e)}",
        )


@app.post("/satellite/imagery", response_model=SatelliteImageryResponse)
async def get_satellite_imagery(request: SatelliteImageryRequest):
    """Fetch satellite imagery from Google Earth Engine."""
    try:
        service = get_earth_engine_service()
        result = await service.get_imagery(
            project_id=request.project_id,
            start_date=request.start_date,
            end_date=request.end_date,
            bands=request.bands,
            resolution=request.resolution,
        )
        return SatelliteImageryResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch imagery: {str(e)}",
        )


@app.post("/analysis/forest-change", response_model=ForestChangeResponse)
async def analyze_forest_change(request: ForestChangeRequest):
    """Analyze forest cover change using Earth Engine."""
    try:
        service = get_earth_engine_service()
        result = await service.analyze_forest_change(
            project_id=request.project_id,
            baseline_year=request.baseline_year,
            comparison_year=request.comparison_year,
            buffer_km=request.buffer_km,
        )
        return ForestChangeResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forest change analysis failed: {str(e)}",
        )


@app.post("/analysis/leakage-zones", response_model=LeakageZoneResponse)
async def analyze_leakage_zones(request: LeakageZoneRequest):
    """Analyze leakage zones around project."""
    try:
        ee_service = get_earth_engine_service()
        pg_service = get_postgis_service()
        
        # Get project boundary
        boundary = await pg_service.get_boundary(request.project_id)
        
        # Analyze leakage
        result = await ee_service.analyze_leakage_zones(
            boundary=boundary,
            buffer_distances=request.buffer_distances,
            directions=request.directions,
        )
        return LeakageZoneResponse(
            project_id=request.project_id,
            zones=result["zones"],
            overall_risk=result["overall_risk"],
            leakage_probability=result["leakage_probability"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Leakage analysis failed: {str(e)}",
        )


@app.post("/map/layers", response_model=MapLayerResponse)
async def create_map_layer(request: MapLayerRequest):
    """Create QGIS map layer for visualization."""
    try:
        service = get_qgis_service()
        result = await service.create_layer(
            project_id=request.project_id,
            layer_type=request.layer_type,
            style=request.style,
        )
        return MapLayerResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Layer creation failed: {str(e)}",
        )


@app.get("/map/projects/{project_id}/all-layers")
async def get_all_project_layers(project_id: str):
    """Get all map layers for a project."""
    try:
        service = get_qgis_service()
        layers = await service.get_project_layers(project_id)
        return {
            "project_id": project_id,
            "layers": layers,
            "map_url": f"/api/v1/gis/map/{project_id}/render",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get layers: {str(e)}",
        )


@app.post("/spatial/query")
async def spatial_query(request: SpatialQueryRequest):
    """Execute spatial query on PostGIS."""
    try:
        service = get_postgis_service()
        results = await service.spatial_query(
            query_type=request.query_type,
            geometry=request.geometry,
            layer=request.layer,
            radius_km=request.radius_km,
        )
        return {
            "query_type": request.query_type,
            "results_count": len(results),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spatial query failed: {str(e)}",
        )


@app.get("/dashboard/spatial-summary")
async def spatial_dashboard_summary():
    """Get summary statistics for spatial dashboard."""
    try:
        pg_service = get_postgis_service()
        ee_service = get_earth_engine_service()
        
        stats = await pg_service.get_spatial_stats()
        recent_imagery = await ee_service.get_recent_imagery_stats()
        
        return {
            "total_projects": stats["total_projects"],
            "total_area_hectares": stats["total_area_hectares"],
            "projects_with_boundaries": stats["projects_with_boundaries"],
            "recent_satellite_scenes": recent_imagery["scene_count"],
            "average_cloud_cover": recent_imagery["avg_cloud_cover"],
            "forest_cover_change_2024": recent_imagery["forest_change"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard summary failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8104)

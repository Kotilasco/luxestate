"""
QGIS Renderer Service
Generate map visualizations using QGIS server
"""

from typing import Dict, List, Optional, Any
from datetime import datetime


class QGISService:
    """
    QGIS integration for map rendering and visualization.
    """

    def __init__(self):
        self.qgis_server_url = "http://localhost:8000/qgis"
        self.mock_mode = True

    async def create_layer(
        self,
        project_id: str,
        layer_type: str,
        style: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a QGIS map layer."""
        layer_id = f"{project_id}_{layer_type}_{datetime.utcnow().strftime('%Y%m%d')}"
        
        # Default styles
        default_styles = {
            "project_boundary": {
                "stroke_color": "#2E7D32",
                "stroke_width": 2,
                "fill_color": "rgba(46, 125, 50, 0.2)",
            },
            "forest_cover": {
                "ramp": ["#1B5E20", "#2E7D32", "#4CAF50", "#81C784", "#C8E6C9"],
                "attribute": "cover_pct",
            },
            "communities": {
                "marker": "circle",
                "size": 8,
                "color": "#D32F2F",
            },
            "water": {
                "fill_color": "#1976D2",
                "stroke_color": "#0D47A1",
            },
            "roads": {
                "stroke_color": "#424242",
                "stroke_width": 1.5,
            },
        }

        applied_style = style or default_styles.get(layer_type, {})

        return {
            "layer_id": layer_id,
            "project_id": project_id,
            "layer_type": layer_type,
            "geojson_url": f"/api/v1/gis/data/{project_id}/{layer_type}.geojson",
            "style_url": f"/api/v1/gis/styles/{layer_id}.json",
            "legend_url": f"/api/v1/gis/legends/{layer_id}.png",
            "style_config": applied_style,
        }

    async def get_project_layers(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all layers for a project."""
        layers = []
        layer_types = [
            "project_boundary",
            "forest_cover",
            "communities",
            "water",
            "roads",
            "deforestation",
        ]
        
        for layer_type in layer_types:
            layer = await self.create_layer(project_id, layer_type)
            layers.append(layer)
        
        return layers

    async def render_map(
        self,
        project_id: str,
        bbox: List[float],
        width: int = 1024,
        height: int = 768,
        layers: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Render map image."""
        return {
            "map_url": f"/api/v1/gis/render/{project_id}?bbox={','.join(map(str, bbox))}&w={width}&h={height}",
            "width": width,
            "height": height,
            "format": "png",
        }

    async def generate_print_layout(
        self,
        project_id: str,
        template: str = "a4_landscape",
    ) -> Dict[str, Any]:
        """Generate print-ready map layout."""
        return {
            "pdf_url": f"/api/v1/gis/exports/{project_id}_{template}.pdf",
            "template": template,
            "elements": [
                "map_canvas",
                "legend",
                "scale_bar",
                "north_arrow",
                "title",
                "project_info",
            ],
        }


# Singleton
_qgis_service = None


def get_qgis_service() -> QGISService:
    global _qgis_service
    if _qgis_service is None:
        _qgis_service = QGISService()
    return _qgis_service

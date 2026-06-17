# ZAI-CTS GIS Architecture

GIS is a first-class platform capability using PostGIS, GeoJSON APIs, Mapbox/OpenLayers, and field mobile capture.

## Required Layers

- Zimbabwe districts
- Registered projects
- Forest cover
- Fire alerts
- Carbon density
- Satellite imagery
- Communities
- IoT sensors
- Rainfall

## Spatial Controls

- Validate project polygon topology
- Ensure boundaries are inside Zimbabwe
- Detect overlap with restricted or already-registered areas
- Attach satellite observation evidence to project and MRV records
- Preserve full spatial audit trail


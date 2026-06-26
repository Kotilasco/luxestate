"""
PostGIS Service
Spatial database operations for carbon project data
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String, DateTime, Integer, Numeric

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://zai_cts:zai_cts@localhost:5432/zai_cts",
)

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class ProjectBoundaryModel(Base):
    __tablename__ = "project_boundaries"
    __table_args__ = {"schema": "gis"}

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    project_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    boundary = None  # GEOMETRY handled via raw SQL
    validation_status: Mapped[str] = mapped_column(String(60), nullable=False, default="pending")
    area_hectares: Mapped[float] = mapped_column(Numeric(18, 4), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class PostGISService:
    """PostGIS integration for spatial data storage and queries."""

    def __init__(self):
        self.db_url = DATABASE_URL

    async def store_boundary(
        self,
        project_id: str,
        project_name: str,
        boundary_geojson: Dict[str, Any],
        area_hectares: float,
        project_type: str,
    ) -> Dict[str, Any]:
        """Store project boundary in PostGIS."""
        async with AsyncSessionFactory() as db:
            geojson_str = json.dumps(boundary_geojson)
            result = await db.execute(
                text("""
                    INSERT INTO gis.project_boundaries (
                        id, project_id, boundary, validation_status, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), :pid,
                        ST_GeomFromGeoJSON(:geojson),
                        'pending', now(), now()
                    )
                    RETURNING id, ST_Area(boundary::geography) / 10000 as calc_area
                """),
                {"pid": project_id, "geojson": geojson_str},
            )
            row = result.mappings().one_or_none()
            await db.commit()

            # Get centroid
            centroid_result = await db.execute(
                text("""
                    SELECT ST_Y(ST_Centroid(boundary)) as lat,
                           ST_X(ST_Centroid(boundary)) as lon
                    FROM gis.project_boundaries WHERE project_id = :pid
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"pid": project_id},
            )
            centroid = centroid_result.mappings().one_or_none()

            return {
                "project_id": project_id,
                "boundary_id": str(row["id"]) if row else None,
                "area_hectares": float(row["calc_area"]) if row else area_hectares,
                "centroid": {
                    "lat": float(centroid["lat"]) if centroid else -16.75,
                    "lon": float(centroid["lon"]) if centroid else 28.25,
                },
                "created_at": datetime.utcnow().isoformat(),
            }

    async def get_boundary(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve project boundary."""
        async with AsyncSessionFactory() as db:
            result = await db.execute(
                text("""
                    SELECT ST_AsGeoJSON(boundary) as geojson,
                           ST_Area(boundary::geography) / 10000 as area_ha,
                           ST_Y(ST_Centroid(boundary)) as lat,
                           ST_X(ST_Centroid(boundary)) as lon
                    FROM gis.project_boundaries
                    WHERE project_id = :pid
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"pid": project_id},
            )
            row = result.mappings().one_or_none()
            if row:
                return {
                    "project_id": project_id,
                    "type": "Polygon",
                    "geojson": json.loads(row["geojson"]) if row["geojson"] else None,
                    "area_ha": float(row["area_ha"]) if row["area_ha"] else 0,
                    "centroid": {
                        "lat": float(row["lat"]) if row["lat"] else -16.75,
                        "lon": float(row["lon"]) if row["lon"] else 28.25,
                    },
                }
            return None

    async def spatial_query(
        self,
        query_type: str,
        geometry: Dict[str, Any],
        layer: str,
        radius_km: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Execute spatial query against project boundaries."""
        async with AsyncSessionFactory() as db:
            geojson_str = json.dumps(geometry)
            result = await db.execute(
                text("""
                    SELECT project_id,
                           ST_Y(ST_Centroid(boundary)) as lat,
                           ST_X(ST_Centroid(boundary)) as lon,
                           ST_Distance(
                               boundary::geography,
                               ST_GeomFromGeoJSON(:geojson)::geography
                           ) / 1000 as distance_km
                    FROM gis.project_boundaries
                    WHERE ST_DWithin(
                        boundary::geography,
                        ST_GeomFromGeoJSON(:geojson)::geography,
                        :radius
                    )
                    ORDER BY distance_km
                """),
                {"geojson": geojson_str, "radius": (radius_km or 50) * 1000},
            )
            rows = result.mappings().all()
            return [
                {
                    "project_id": str(r["project_id"]),
                    "distance_km": round(float(r["distance_km"]), 2),
                    "centroid": {"lat": float(r["lat"]), "lon": float(r["lon"])},
                }
                for r in rows
            ]

    async def get_spatial_stats(self) -> Dict[str, Any]:
        """Get spatial statistics."""
        async with AsyncSessionFactory() as db:
            result = await db.execute(
                text("""
                    SELECT COUNT(*) as total_projects,
                           COALESCE(SUM(ST_Area(boundary::geography) / 10000), 0) as total_area
                    FROM gis.project_boundaries
                """)
            )
            row = result.mappings().one_or_none()
            return {
                "total_projects": int(row["total_projects"]) if row else 0,
                "total_area_hectares": float(row["total_area"]) if row else 0,
                "projects_with_boundaries": int(row["total_projects"]) if row else 0,
            }


_pg_service = None


def get_postgis_service() -> PostGISService:
    global _pg_service
    if _pg_service is None:
        _pg_service = PostGISService()
    return _pg_service

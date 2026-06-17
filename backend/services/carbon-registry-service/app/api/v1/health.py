from fastapi import APIRouter
from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest
from starlette.responses import Response

router = APIRouter(tags=["Operations"])

health_checks_total = Counter("zai_cts_health_checks_total", "Total health checks")


@router.get("/health")
async def health() -> dict[str, str]:
    health_checks_total.inc()
    return {"status": "healthy", "service": "carbon-registry-service"}


@router.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

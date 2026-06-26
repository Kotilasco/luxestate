"""Anchor API routes for Merkle root anchoring and verification."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db_session
from app.infrastructure.anchoring.anchoring_service import AnchoringService

router = APIRouter(prefix="/anchors", tags=["anchors"])


@router.get("/status/unanchored-count", response_model=dict[str, Any])
async def unanchored_count(
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Return the count of credit entries not yet anchored."""
    from sqlalchemy import select, func
    from app.infrastructure.database.models import CarbonCreditEntry

    result = await db.execute(
        select(func.count()).select_from(CarbonCreditEntry).where(CarbonCreditEntry.anchor_batch_id.is_(None))
    )
    count = result.scalar() or 0
    return {"unanchored_count": count}


@router.post("/batch", response_model=dict[str, Any])
async def anchor_unanchored_batch(
    batch_name: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Anchor all currently unanchored credit entries into a new Merkle batch."""
    service = AnchoringService(db)
    result = await service.anchor_unanchored_credits(batch_name=batch_name)
    if result.get("status") == "no_entries":
        raise HTTPException(status_code=400, detail=result)
    return result


@router.get("/{anchor_id}/verify", response_model=dict[str, Any])
async def verify_anchor(
    anchor_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Recompute the Merkle root for the given anchor and verify integrity."""
    service = AnchoringService(db)
    result = await service.verify_anchor(anchor_id)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail=result)
    return result


@router.get("/reconcile", response_model=list[dict[str, Any]])
async def reconcile_chain(
    db: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    """Reconcile the entire anchor chain for continuity and integrity."""
    service = AnchoringService(db)
    return await service.reconcile_chain()

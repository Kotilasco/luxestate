"""Batch anchoring service: computes Merkle roots and anchors them."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models import (
    AnchorBatch,
    CarbonCreditEntry,
)
from app.infrastructure.anchoring.merkle import (
    compute_merkle_root,
    hash_credit_entry,
    hash_anchor_batch,
)


class AnchoringService:
    """Service that batches credit entries and anchors their Merkle root.

    This service implements the Merkle root anchoring pattern:
    1. PostgreSQL remains the source of truth.
    2. Each credit entry gets a deterministic hash.
    3. Unanchored entries are collected into a batch.
    4. A Merkle tree is built from entry hashes.
    5. The Merkle root is stored in anchor_batches (hash chain).
    6. fabric_tx_id is stored as a mock / placeholder.
    7. Future: write the Merkle root to Hyperledger Fabric.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def anchor_unanchored_credits(
        self,
        batch_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Find all unanchored credit entries and anchor them.

        Returns:
            Dict with anchor details including merkle_root, fabric_tx_id, etc.
        """
        # 1. Find all unanchored entries
        result = await self.db.execute(
            select(CarbonCreditEntry).where(CarbonCreditEntry.anchor_batch_id.is_(None))
        )
        entries = result.scalars().all()

        if not entries:
            return {"status": "no_entries", "message": "No unanchored credit entries found"}

        entry_hashes = []
        for entry in entries:
            entry_hash = hash_credit_entry(
                serial_number=entry.serial_number,
                vintage_year=entry.vintage_year,
                quantity_tco2e=str(entry.quantity_tco2e),
                project_id=str(entry.batch_id),  # Using batch_id as project linkage
                batch_id=str(entry.batch_id),
            )
            entry_hashes.append(entry_hash)

        # 2. Compute Merkle root
        merkle_root = compute_merkle_root(entry_hashes)

        # 3. Get previous anchor for hash chain
        prev_result = await self.db.execute(
            select(AnchorBatch)
            .where(AnchorBatch.status == "anchored")
            .order_by(AnchorBatch.anchored_at.desc())
            .limit(1)
        )
        prev_anchor = prev_result.scalar_one_or_none()
        previous_anchor_id = prev_anchor.id if prev_anchor else None
        previous_anchor_hash = prev_anchor.merkle_root if prev_anchor else None

        # 4. Build anchor batch hash (hash chain)
        now = datetime.now(timezone.utc).isoformat()
        anchor_hash = hash_anchor_batch(
            merkle_root=merkle_root,
            previous_anchor_hash=previous_anchor_hash,
            timestamp=now,
            entry_count=len(entries),
        )

        # 5. Create mock fabric_tx_id (future: replace with real Fabric tx)
        fabric_tx_id = f"fabric:{uuid.uuid4().hex}"
        fabric_block_number = await self._next_block_number()

        # 6. Create anchor batch record
        anchor = AnchorBatch(
            batch_name=batch_name or f"batch-{now[:19].replace(':', '')}",
            from_record_id=entries[0].id,
            to_record_id=entries[-1].id,
            entry_count=len(entries),
            merkle_root=merkle_root,
            previous_anchor_id=previous_anchor_id,
            previous_anchor_hash=previous_anchor_hash,
            fabric_tx_id=fabric_tx_id,
            fabric_block_number=fabric_block_number,
            anchored_at=datetime.now(timezone.utc),
            status="anchored",
        )
        self.db.add(anchor)
        await self.db.flush()

        # 7. Link entries to this anchor
        for entry in entries:
            entry.anchor_batch_id = anchor.id

        await self.db.commit()

        return {
            "status": "anchored",
            "anchor_id": str(anchor.id),
            "batch_name": anchor.batch_name,
            "merkle_root": merkle_root,
            "anchor_hash": anchor_hash,
            "entry_count": len(entries),
            "fabric_tx_id": fabric_tx_id,
            "fabric_block_number": fabric_block_number,
            "previous_anchor_id": str(previous_anchor_id) if previous_anchor_id else None,
        }

    async def verify_anchor(self, anchor_id: str) -> Dict[str, Any]:
        """Verify an anchor by recomputing the Merkle root from DB entries.

        Returns:
            Dict with verification result.
        """
        anchor_result = await self.db.execute(
            select(AnchorBatch).where(AnchorBatch.id == anchor_id)
        )
        anchor = anchor_result.scalar_one_or_none()
        if not anchor:
            return {"status": "not_found", "message": f"Anchor {anchor_id} not found"}

        entries_result = await self.db.execute(
            select(CarbonCreditEntry).where(CarbonCreditEntry.anchor_batch_id == anchor.id)
        )
        entries = entries_result.scalars().all()

        entry_hashes = []
        for entry in entries:
            entry_hash = hash_credit_entry(
                serial_number=entry.serial_number,
                vintage_year=entry.vintage_year,
                quantity_tco2e=str(entry.quantity_tco2e),
                project_id=str(entry.batch_id),
                batch_id=str(entry.batch_id),
            )
            entry_hashes.append(entry_hash)

        recomputed_root = compute_merkle_root(entry_hashes)
        is_valid = recomputed_root.lower() == anchor.merkle_root.lower()

        return {
            "status": "verified" if is_valid else "tampered",
            "anchor_id": anchor_id,
            "stored_root": anchor.merkle_root,
            "recomputed_root": recomputed_root,
            "entry_count": len(entries),
            "fabric_tx_id": anchor.fabric_tx_id,
            "is_valid": is_valid,
        }

    async def reconcile_chain(self) -> List[Dict[str, Any]]:
        """Reconcile the entire anchor chain. Check for breaks.

        Returns:
            List of reconciliation reports per anchor.
        """
        result = await self.db.execute(
            select(AnchorBatch).where(AnchorBatch.status == "anchored").order_by(AnchorBatch.anchored_at)
        )
        anchors = result.scalars().all()

        reports = []
        for i, anchor in enumerate(anchors):
            report = await self.verify_anchor(str(anchor.id))

            # Check hash chain continuity
            if i > 0:
                prev = anchors[i - 1]
                chain_ok = anchor.previous_anchor_hash == prev.merkle_root
                report["chain_continuous"] = chain_ok
            else:
                report["chain_continuous"] = True  # First anchor has no predecessor

            reports.append(report)

        return reports

    async def _next_block_number(self) -> int:
        """Get next mock block number (auto-increment)."""
        result = await self.db.execute(
            select(AnchorBatch.fabric_block_number)
            .where(AnchorBatch.fabric_block_number.is_not(None))
            .order_by(AnchorBatch.fabric_block_number.desc())
            .limit(1)
        )
        max_block = result.scalar_one_or_none()
        return (max_block or 0) + 1

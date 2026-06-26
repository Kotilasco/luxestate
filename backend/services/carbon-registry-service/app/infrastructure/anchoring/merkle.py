"""Merkle tree implementation for batch anchoring."""
from __future__ import annotations

import hashlib
from typing import List, Optional


def sha256_hash(data: str) -> str:
    """Compute SHA-256 hex digest of a string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_merkle_root(hashes: List[str]) -> str:
    """Build a Merkle tree and return the root hash.

    Args:
        hashes: List of leaf hashes (64-char hex strings).

    Returns:
        64-character hex root hash.
    """
    if not hashes:
        return sha256_hash("")

    # Normalize all hashes to lowercase
    level = [h.lower() for h in hashes]

    # If odd number of leaves, duplicate the last one
    if len(level) % 2 == 1:
        level.append(level[-1])

    while len(level) > 1:
        next_level = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else left
            combined = sha256_hash(left + right)
            next_level.append(combined)
        level = next_level
        # If odd number at this level, duplicate last
        if len(level) > 1 and len(level) % 2 == 1:
            level.append(level[-1])

    return level[0]


def hash_credit_entry(
    serial_number: str,
    vintage_year: int,
    quantity_tco2e: str,
    project_id: str,
    batch_id: str,
) -> str:
    """Create deterministic hash for a single credit entry.

    Args:
        serial_number: Unique serial number.
        vintage_year: Vintage year.
        quantity_tco2e: Quantity as string.
        project_id: Project UUID.
        batch_id: Batch UUID.

    Returns:
        64-character hex hash.
    """
    data = f"{serial_number}:{vintage_year}:{quantity_tco2e}:{project_id}:{batch_id}"
    return sha256_hash(data)


def hash_anchor_batch(
    merkle_root: str,
    previous_anchor_hash: Optional[str],
    timestamp: str,
    entry_count: int,
) -> str:
    """Create deterministic hash for an anchor batch record.

    Args:
        merkle_root: The Merkle root of this batch.
        previous_anchor_hash: Hash of previous anchor (for chain).
        timestamp: ISO timestamp string.
        entry_count: Number of entries in batch.

    Returns:
        64-character hex hash.
    """
    prev = previous_anchor_hash or "0" * 64
    data = f"{merkle_root}:{prev}:{timestamp}:{entry_count}"
    return sha256_hash(data)

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models import SessionModel, UserModel
from app.infrastructure.database.session import get_session


@dataclass(frozen=True)
class CurrentUser:
    actor_id: UUID | None
    actor_role: str | None


def _token_hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


async def get_current_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> CurrentUser:
    """Get current user from the Authorization token.

    SECURITY: The actor_role is ALWAYS looked up from the database session
    associated with the authorization token. Role headers are NEVER trusted.
    """
    return await require_authenticated_user(authorization, db)


async def require_authenticated_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> CurrentUser:
    """Require an authenticated user - raises 401 if not authenticated."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "").strip()

    result = await db.execute(
        select(SessionModel).where(
            SessionModel.token_hash == _token_hash(token),
            SessionModel.expires_at > datetime.now(tz=UTC),
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_result = await db.execute(
        select(UserModel).where(UserModel.id == session.user_id)
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    return CurrentUser(
        actor_id=user.id,
        actor_role=user.role,
    )

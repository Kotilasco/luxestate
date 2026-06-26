from datetime import UTC, datetime, timedelta
from hashlib import pbkdf2_hmac, sha256
from secrets import token_hex
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models import (
    ApiKeyModel,
    PasswordResetModel,
    SessionModel,
    UserModel,
)
from app.infrastructure.database.session import get_session
from app.infrastructure.security.rbac import (
    ROLE_PERMISSIONS,
    AuthenticatedUser,
    Permission,
    check_permission,
    get_authenticated_user,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Identity and Access Management"])

ADMIN_EMAIL = "admin@zai-cts.gov.zw"
ADMIN_PASSWORD_ENV = "ZAI_CTS_ADMIN_PASSWORD"


class OrganizationRegistrationRequest(BaseModel):
    name: str = Field(min_length=3, max_length=220)
    organization_type: str = Field(min_length=3, max_length=80)
    country: str = Field(default="Zimbabwe", min_length=2, max_length=80)
    registration_number: str = Field(min_length=3, max_length=120)


class RegisterUserRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=180)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=160)
    role: str = Field(min_length=3, max_length=80)
    organization: OrganizationRegistrationRequest | None = None


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=160)
    mfa_code: str | None = Field(default=None, min_length=6, max_length=6)


class PasswordResetRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)


class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(min_length=20, max_length=160)
    new_password: str = Field(min_length=8, max_length=160)


class UserApprovalRequest(BaseModel):
    status: str = Field(pattern="^(approved|suspended|rejected)$")
    reason: str = Field(min_length=4, max_length=300)


class ApiKeyRequest(BaseModel):
    label: str = Field(min_length=3, max_length=80)
    scopes: list[str] = Field(default_factory=list)


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    organization_type: str
    country: str
    registration_number: str
    kyb_status: str
    approval_status: str


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    status: str
    email_verified: bool
    mfa_enabled: bool
    organization: OrganizationResponse | None
    permissions: list[str]
    digital_signature: str


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserResponse


class ApiKeyResponse(BaseModel):
    id: UUID
    label: str
    key_prefix: str
    scopes: list[str]
    created_at: datetime


class MessageResponse(BaseModel):
    message: str


def _hash_password(password: str, salt: str) -> str:
    return pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()


def _new_signature(email: str) -> str:
    return f"SIG-ZAI-{sha256(email.encode()).hexdigest()[:24].upper()}"


def _token_hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def _organization_response(org_row) -> OrganizationResponse | None:
    if org_row is None:
        return None
    return OrganizationResponse(
        id=org_row.id,
        name=org_row.legal_name,
        organization_type=org_row.organization_type,
        country=org_row.country_code,
        registration_number=org_row.registration_number,
        kyb_status=getattr(org_row, "kyb_status", "approved"),
        approval_status=getattr(org_row, "approval_status", "approved"),
    )


def _user_response(user: UserModel, org=None) -> UserResponse:
    role = user.role
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role,
        status=user.status,
        email_verified=user.email_verified,
        mfa_enabled=user.mfa_enabled,
        organization=_organization_response(org),
        permissions=ROLE_PERMISSIONS.get(role, []),
        digital_signature=user.digital_signature or _new_signature(user.email),
    )


async def _get_user_by_email(db: AsyncSession, email: str) -> UserModel | None:
    result = await db.execute(select(UserModel).where(UserModel.email == email.lower()))
    return result.scalar_one_or_none()


async def _get_user_by_id(db: AsyncSession, user_id: UUID) -> UserModel | None:
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    return result.scalar_one_or_none()


import os
_DEFAULT_ADMIN_PASSWORD = os.getenv(ADMIN_PASSWORD_ENV)


async def seed_administrator(db: AsyncSession) -> None:
    result = await db.execute(select(UserModel).limit(1))
    if result.scalar_one_or_none() is not None:
        return
    raw_password = _DEFAULT_ADMIN_PASSWORD
    if not raw_password:
        return
    salt = token_hex(16)
    admin_id = UUID("11111111-1111-4111-8111-111111111111")
    org_id = UUID("22222222-2222-4222-8222-222222222222")
    admin = UserModel(
        id=admin_id,
        full_name="ZiCMA Registry Administrator",
        email=ADMIN_EMAIL,
        password_hash=_hash_password(raw_password, salt),
        salt=salt,
        role="Super Administrator",
        status="approved",
        email_verified=True,
        mfa_enabled=False,
        organization_id=org_id,
        digital_signature=_new_signature(ADMIN_EMAIL),
    )
    db.add(admin)
    await db.commit()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: RegisterUserRequest,
    db: AsyncSession = Depends(get_session),
) -> UserResponse:
    existing = await _get_user_by_email(db, request.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    if request.role not in ROLE_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported role.",
        )
    salt = token_hex(16)
    user = UserModel(
        id=uuid4(),
        full_name=request.full_name,
        email=request.email.lower(),
        password_hash=_hash_password(request.password, salt),
        salt=salt,
        role=request.role,
        status="pending_approval",
        email_verified=False,
        mfa_enabled=False,
        digital_signature=_new_signature(request.email.lower()),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _user_response(user)


@router.post("/login", response_model=AuthSessionResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_session),
) -> AuthSessionResponse:
    user = await _get_user_by_email(db, request.email)
    if user is None or user.password_hash != _hash_password(request.password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if user.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status}. Approval is required before login.",
        )
    if user.mfa_enabled:
        if not request.mfa_code or len(request.mfa_code) != 6:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Valid MFA code is required.",
            )
    token = token_hex(32)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    session = SessionModel(
        id=uuid4(),
        token_hash=_token_hash(token),
        user_id=user.id,
        expires_at=expires_at,
        ip_address=http_request.client.host if http_request.client else None,
        device=http_request.headers.get("user-agent"),
    )
    db.add(session)
    await db.commit()
    org = None
    if user.organization_id:
        org_result = await db.execute(
            text("SELECT * FROM identity.organizations WHERE id = :oid"),
            {"oid": str(user.organization_id)},
        )
        org = org_result.mappings().one_or_none()
    return AuthSessionResponse(
        access_token=token,
        expires_at=expires_at,
        user=_user_response(user, org),
    )


@router.get("/me", response_model=UserResponse)
async def current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> UserResponse:
    token = (authorization or "").replace("Bearer ", "")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
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
            detail="Session is not valid.",
        )
    user = await _get_user_by_id(db, session.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    org = None
    if user.organization_id:
        org_result = await db.execute(
            text("SELECT * FROM identity.organizations WHERE id = :oid"),
            {"oid": str(user.organization_id)},
        )
        org = org_result.mappings().one_or_none()
    return _user_response(user, org)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    token = (authorization or "").replace("Bearer ", "")
    if token:
        await db.execute(
            delete(SessionModel).where(SessionModel.token_hash == _token_hash(token))
        )
        await db.commit()
    return MessageResponse(message="Logged out.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    user = await _get_user_by_email(db, request.email)
    if user is not None:
        token = token_hex(20)
        reset = PasswordResetModel(
            id=uuid4(),
            user_id=user.id,
            token_hash=_token_hash(token),
            expires_at=datetime.now(tz=UTC) + timedelta(hours=24),
        )
        db.add(reset)
        await db.commit()
    return MessageResponse(
        message="If the account exists, a password reset token has been generated."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    result = await db.execute(
        select(PasswordResetModel).where(
            PasswordResetModel.token_hash == _token_hash(request.token),
            PasswordResetModel.expires_at > datetime.now(tz=UTC),
            PasswordResetModel.used_at.is_(None),
        )
    )
    reset = result.scalar_one_or_none()
    if reset is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token.",
        )
    user = await _get_user_by_id(db, reset.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found.",
        )
    salt = token_hex(16)
    user.salt = salt
    user.password_hash = _hash_password(request.new_password, salt)
    reset.used_at = datetime.now(tz=UTC)
    await db.commit()
    return MessageResponse(message="Password reset complete.")


@router.post(
    "/users/{user_id}/approval",
    response_model=UserResponse,
    responses={403: {"description": "Permission denied"}},
)
async def approve_user(
    user_id: UUID,
    request: UserApprovalRequest,
    current_user: AuthenticatedUser = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_session),
) -> UserResponse:
    check_permission(current_user, Permission.USERS_APPROVE)
    user = await _get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )
    user.status = request.status
    if request.status == "approved":
        user.email_verified = True
        if user.organization_id:
            await db.execute(
                text(
                    "UPDATE identity.organizations SET status = 'active' WHERE id = :oid"
                ),
                {"oid": str(user.organization_id)},
            )
    await db.commit()
    await db.refresh(user)
    org = None
    if user.organization_id:
        org_result = await db.execute(
            text("SELECT * FROM identity.organizations WHERE id = :oid"),
            {"oid": str(user.organization_id)},
        )
        org = org_result.mappings().one_or_none()
    return _user_response(user, org)


@router.get("/users", response_model=list[UserResponse], responses={403: {"description": "Permission denied"}})
async def list_users(
    current_user: AuthenticatedUser = Depends(get_authenticated_user),
    db: AsyncSession = Depends(get_session),
) -> list[UserResponse]:
    if not current_user.has_any_permission(
        [Permission.USERS_MANAGE, Permission.USERS_APPROVE, Permission.AUDIT_VIEW]
    ):
        user = await _get_user_by_id(db, current_user.actor_id)
        if user:
            return [_user_response(user)]
        return []
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    org_ids = [u.organization_id for u in users if u.organization_id]
    org_map = {}
    if org_ids:
        org_result = await db.execute(
            text(
                "SELECT * FROM identity.organizations WHERE id = ANY(:oids)"
            ),
            {"oids": [str(oid) for oid in org_ids]},
        )
        for row in org_result.mappings().all():
            org_map[row["id"]] = row
    return [_user_response(u, org_map.get(u.organization_id)) for u in users]


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    request: ApiKeyRequest,
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> ApiKeyResponse:
    me = await current_user(authorization, db)
    key_raw = f"zai_{token_hex(16)}"
    key = ApiKeyModel(
        id=uuid4(),
        user_id=me.id,
        label=request.label,
        key_hash=_token_hash(key_raw),
        key_prefix=f"zai_{token_hex(4)}",
        scopes={"scopes": request.scopes or me.permissions},
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return ApiKeyResponse(
        id=key.id,
        label=key.label,
        key_prefix=key.key_prefix,
        scopes=key.scopes.get("scopes", []),
        created_at=key.created_at,
    )

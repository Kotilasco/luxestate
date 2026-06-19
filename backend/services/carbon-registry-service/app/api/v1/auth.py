from datetime import UTC, datetime, timedelta
from hashlib import pbkdf2_hmac, sha256
from secrets import token_hex
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/v1/auth", tags=["Identity and Access Management"])


ROLE_PERMISSIONS = {
    "Super Administrator": ["*"],
    "ZiCMA Administrator": ["registry.admin", "article6.approve", "compliance.enforce"],
    "Registry Officer": ["organizations.review", "projects.review", "credits.issue"],
    "Registry Manager": ["registry.manage", "credits.manage", "reports.approve"],
    "Project Developer": ["projects.create", "evidence.upload", "monitoring.submit"],
    "Accredited Validator": ["validation.review", "validation.decide"],
    "Accredited Verifier": ["verification.review", "verification.sign"],
    "GIS Analyst": ["gis.review", "gis.lineage.record"],
    "MRV Officer": ["mrv.review", "monitoring.inspect"],
    "AI Review Officer": ["ai.review", "ai.override"],
    "Compliance Officer": ["compliance.case.open", "ledger.freeze"],
    "Legal Officer": ["appeals.review", "rules.adopt"],
    "Marketplace Operator": ["marketplace.list", "settlement.record"],
    "Finance Officer": ["invoices.issue", "payments.reconcile", "fees.configure"],
    "Community Officer": ["consultation.record", "safeguards.review"],
    "Buyer": ["portfolio.view", "credits.buy", "credits.retire"],
    "Seller": ["portfolio.view", "credits.sell"],
    "Auditor": ["audit.view", "reports.export"],
    "Public User": ["public.registry.view", "certificate.verify"],
    "Government Officer": ["registry.review", "organizations.review", "reports.view"],
    "Administrator": ["users.manage", "roles.manage", "system.configure"],
}


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


def _user_response(user: dict[str, object]) -> UserResponse:
    role = str(user["role"])
    organization = user.get("organization")
    return UserResponse(
        id=user["id"],  # type: ignore[arg-type]
        full_name=str(user["full_name"]),
        email=str(user["email"]),
        role=role,
        status=str(user["status"]),
        email_verified=bool(user["email_verified"]),
        mfa_enabled=bool(user["mfa_enabled"]),
        organization=OrganizationResponse(**organization) if isinstance(organization, dict) else None,
        permissions=ROLE_PERMISSIONS.get(role, []),
        digital_signature=str(user["digital_signature"]),
    )


def _seed_admin() -> None:
    if USERS:
        return
    salt = token_hex(16)
    USERS["admin@zai-cts.gov.zw"] = {
        "id": UUID("11111111-1111-4111-8111-111111111111"),
        "full_name": "ZiCMA Registry Administrator",
        "email": "admin@zai-cts.gov.zw",
        "role": "Super Administrator",
        "status": "approved",
        "salt": salt,
        "password_hash": _hash_password("Admin@12345", salt),
        "email_verified": True,
        "mfa_enabled": False,
        "organization": {
            "id": UUID("22222222-2222-4222-8222-222222222222"),
            "name": "Zimbabwe Carbon Markets Authority",
            "organization_type": "Government",
            "country": "Zimbabwe",
            "registration_number": "ZICMA-001",
            "kyb_status": "approved",
            "approval_status": "approved",
        },
        "digital_signature": _new_signature("admin@zai-cts.gov.zw"),
        "created_at": datetime.now(tz=UTC),
    }


USERS: dict[str, dict[str, object]] = {}
SESSIONS: dict[str, dict[str, object]] = {}
RESET_TOKENS: dict[str, str] = {}
API_KEYS: dict[UUID, list[ApiKeyResponse]] = {}
_seed_admin()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(request: RegisterUserRequest) -> UserResponse:
    email = request.email.lower()
    if email in USERS:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")
    if request.role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported role.")

    salt = token_hex(16)
    organization = None
    if request.organization:
        organization = {
            "id": uuid4(),
            "name": request.organization.name,
            "organization_type": request.organization.organization_type,
            "country": request.organization.country,
            "registration_number": request.organization.registration_number,
            "kyb_status": "pending",
            "approval_status": "pending",
        }
    user = {
        "id": uuid4(),
        "full_name": request.full_name,
        "email": email,
        "role": request.role,
        "status": "pending_approval",
        "salt": salt,
        "password_hash": _hash_password(request.password, salt),
        "email_verified": False,
        "mfa_enabled": False,
        "organization": organization,
        "digital_signature": _new_signature(email),
        "created_at": datetime.now(tz=UTC),
    }
    USERS[email] = user
    return _user_response(user)


@router.post("/login", response_model=AuthSessionResponse)
async def login(request: LoginRequest) -> AuthSessionResponse:
    user = USERS.get(request.email.lower())
    if user is None or user["password_hash"] != _hash_password(request.password, str(user["salt"])):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if user["status"] != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Account is {user['status']}. Approval is required before login.")
    if bool(user["mfa_enabled"]) and request.mfa_code != "123456":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid MFA code is required.")

    token = token_hex(32)
    expires_at = datetime.now(tz=UTC) + timedelta(hours=8)
    SESSIONS[token] = {"user_email": user["email"], "expires_at": expires_at, "created_at": datetime.now(tz=UTC)}
    return AuthSessionResponse(access_token=token, expires_at=expires_at, user=_user_response(user))


@router.get("/me", response_model=UserResponse)
async def current_user(authorization: str | None = Header(default=None, alias="Authorization")) -> UserResponse:
    token = (authorization or "").replace("Bearer ", "")
    session = SESSIONS.get(token)
    if session is None or session["expires_at"] < datetime.now(tz=UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is not valid.")
    return _user_response(USERS[str(session["user_email"])])


@router.post("/logout", response_model=MessageResponse)
async def logout(authorization: str | None = Header(default=None, alias="Authorization")) -> MessageResponse:
    token = (authorization or "").replace("Bearer ", "")
    SESSIONS.pop(token, None)
    return MessageResponse(message="Logged out.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: PasswordResetRequest) -> MessageResponse:
    if request.email.lower() in USERS:
        RESET_TOKENS[request.email.lower()] = token_hex(20)
    return MessageResponse(message="If the account exists, a password reset token has been generated.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: PasswordResetConfirmRequest) -> MessageResponse:
    email = next((email for email, token in RESET_TOKENS.items() if token == request.token), None)
    if email is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password reset token.")
    salt = token_hex(16)
    USERS[email]["salt"] = salt
    USERS[email]["password_hash"] = _hash_password(request.new_password, salt)
    RESET_TOKENS.pop(email, None)
    return MessageResponse(message="Password reset complete.")


@router.post("/users/{user_id}/approval", response_model=UserResponse)
async def approve_user(user_id: UUID, request: UserApprovalRequest) -> UserResponse:
    user = next((candidate for candidate in USERS.values() if candidate["id"] == user_id), None)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User was not found.")
    user["status"] = request.status
    if request.status == "approved":
        user["email_verified"] = True
        organization = user.get("organization")
        if isinstance(organization, dict):
            organization["kyb_status"] = "approved"
            organization["approval_status"] = "approved"
    return _user_response(user)


@router.get("/users", response_model=list[UserResponse])
async def list_users() -> list[UserResponse]:
    return [_user_response(user) for user in USERS.values()]


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(request: ApiKeyRequest, authorization: str | None = Header(default=None, alias="Authorization")) -> ApiKeyResponse:
    user = await current_user(authorization)
    key = ApiKeyResponse(
        id=uuid4(),
        label=request.label,
        key_prefix=f"zai_{token_hex(4)}",
        scopes=request.scopes or user.permissions,
        created_at=datetime.now(tz=UTC),
    )
    API_KEYS.setdefault(user.id, []).append(key)
    return key

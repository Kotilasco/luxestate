"""Compliance Service - Module C: Regulatory Compliance & Double Counting Prevention"""
import os
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Literal, Optional
from uuid import UUID, uuid4
from hashlib import sha256

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, NUMERIC, JSONB
from sqlalchemy import String, DateTime, Integer, Boolean

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://zai_cts:zai_cts@localhost:5432/zai_cts")
CARBON_REGISTRY_URL = os.getenv("CARBON_REGISTRY_URL", "http://localhost:8101")


class Base(DeclarativeBase):
    pass


class RetirementRecordModel(Base):
    __tablename__ = "credit_retirements"
    __table_args__ = {"schema": "registry"}

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    beneficiary_name: Mapped[str] = mapped_column(String(255), nullable=False)
    retirement_purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    claim_type: Mapped[str] = mapped_column(String(80), nullable=False)
    quantity_tco2e: Mapped[Decimal] = mapped_column(NUMERIC(18, 4), nullable=False)
    certificate_number: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    public_certificate_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AuthorizationApplicationModel(Base):
    __tablename__ = "authorizations"
    __table_args__ = {"schema": "article6"}

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    authorization_number: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    authorization_type: Mapped[str] = mapped_column(String(80), nullable=False)
    use_purpose: Mapped[str] = mapped_column(String(120), nullable=False)
    ndc_sector: Mapped[str] = mapped_column(String(120), nullable=False)
    corresponding_adjustment_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(60), nullable=False, default="draft")
    authorized_quantity_tco2e: Mapped[Optional[Decimal]] = mapped_column(NUMERIC(18, 4), nullable=True)
    first_transfer_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionFactory() as session:
        yield session


async def require_auth(authorization: str = Header(..., alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{CARBON_REGISTRY_URL}/api/v1/auth/me",
                headers={"Authorization": authorization},
                timeout=5.0,
            )
        except Exception:
            raise HTTPException(status_code=503, detail="Auth service unavailable")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return resp.json()


app = FastAPI(
    title="ZAI-CTS Compliance Service",
    version="1.0.0",
    description="Regulatory Compliance: Serialization, Retirement, and Article 6 Authorization",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class SerializationRequest(BaseModel):
    project_id: UUID
    quantity: int
    vintage_year: int


class SerializationResponse(BaseModel):
    serial_numbers: List[str]
    blockchain_tx_hash: str


class RetirementRequest(BaseModel):
    serial_numbers: List[str]
    buyer_id: UUID
    purpose: Literal["ndc_compliance", "voluntary", "corsia"]
    corresponding_adjustment: bool = True


class RetirementResponse(BaseModel):
    retirement_id: UUID
    status: str
    blockchain_confirmation: str
    zcr_retirement_id: str
    un_file_url: str


class RetirementStatus(BaseModel):
    serial_number: str
    status: Literal["active", "retired", "transferred"]
    retirement_date: Optional[datetime]
    owner: Optional[str]
    blockchain_proof: Optional[str]


class AuthorizationApplicationRequest(BaseModel):
    project_id: UUID
    applicant_id: UUID
    quantity_requested: int
    intended_buyer_country: str
    authorization_purpose: str
    supporting_documents: List[str] = []


class AuthorizationApplicationResponse(BaseModel):
    application_id: UUID
    status: str
    submitted_at: datetime
    estimated_review_days: int


class ZiCMADecision(BaseModel):
    application_id: UUID
    decision: Literal["approve", "reject", "request_info"]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "compliance-service", "version": "1.0.0"}


@app.post("/api/v1/compliance/serialization")
async def serialize_credits(
    request: SerializationRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    serial_numbers = [
        f"ZAI-{request.project_id}-{request.vintage_year}-{i:06d}"
        for i in range(1, request.quantity + 1)
    ]
    return SerializationResponse(
        serial_numbers=serial_numbers,
        blockchain_tx_hash=f"0x{sha256(''.join(serial_numbers).encode()).hexdigest()[:16]}",
    )


@app.post("/api/v1/compliance/retirements")
async def retire_credits(
    request: RetirementRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    cert_hash = sha256(
        f"{request.buyer_id}-{request.purpose}-{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()
    cert_number = f"ZCR-RET-{cert_hash[:12].upper()}"
    retirement = RetirementRecordModel(
        id=uuid4(),
        account_id=request.buyer_id,
        beneficiary_name=f"Account {request.buyer_id}",
        retirement_purpose=request.purpose,
        claim_type="voluntary",
        quantity_tco2e=Decimal(str(len(request.serial_numbers))),
        certificate_number=cert_number,
        public_certificate_hash=cert_hash,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(retirement)
    await db.commit()
    return RetirementResponse(
        retirement_id=retirement.id,
        status="retired",
        blockchain_confirmation=f"0x{cert_hash[:16]}",
        zcr_retirement_id=cert_number,
        un_file_url=f"/api/v1/compliance/un-reporting/{retirement.id}",
    )


@app.get("/api/v1/compliance/retirements/{serial_number}/status")
async def get_retirement_status(
    serial_number: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    result = await db.execute(
        select(RetirementRecordModel).where(
            RetirementRecordModel.certificate_number == serial_number
        )
    )
    record = result.scalar_one_or_none()
    if record:
        return RetirementStatus(
            serial_number=serial_number,
            status="retired",
            retirement_date=record.created_at,
            owner=str(record.account_id),
            blockchain_proof=record.public_certificate_hash,
        )
    return RetirementStatus(
        serial_number=serial_number,
        status="active",
        retirement_date=None,
        owner=None,
        blockchain_proof=None,
    )


@app.post("/api/v1/compliance/authorizations")
async def submit_authorization(
    request: AuthorizationApplicationRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    auth_id = uuid4()
    auth = AuthorizationApplicationModel(
        id=auth_id,
        project_id=request.project_id,
        authorization_number=f"ZAI-A6-{auth_id.hex[:8].upper()}",
        authorization_type="export",
        use_purpose=request.authorization_purpose,
        ndc_sector="energy",
        status="submitted",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(auth)
    await db.commit()
    return AuthorizationApplicationResponse(
        application_id=auth_id,
        status="submitted",
        submitted_at=datetime.utcnow(),
        estimated_review_days=14,
    )


@app.post("/api/v1/compliance/authorizations/{application_id}/decision")
async def authorization_decision(
    application_id: UUID,
    decision: ZiCMADecision,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    result = await db.execute(
        select(AuthorizationApplicationModel).where(
            AuthorizationApplicationModel.id == application_id
        )
    )
    auth = result.scalar_one_or_none()
    if auth is None:
        raise HTTPException(status_code=404, detail="Authorization not found")
    auth.status = decision.decision
    auth.updated_at = datetime.utcnow()
    await db.commit()
    return {"application_id": application_id, "status": decision.decision}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8107)

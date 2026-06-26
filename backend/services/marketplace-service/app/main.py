"""Marketplace Service - Module B: Smart Marketplace & Pricing"""
import os
from contextlib import asynccontextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, NUMERIC, JSONB
from sqlalchemy import String, DateTime, Integer

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://zai_cts:zai_cts@localhost:5432/zai_cts")
CARBON_REGISTRY_URL = os.getenv("CARBON_REGISTRY_URL", "http://localhost:8101")

# ---------------------------------------------------------------------------
# Database models (inline for service independence)
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


class MarketplaceListingModel(Base):
    __tablename__ = "marketplace_listings"
    __table_args__ = {"schema": "market"}

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    seller_account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    vintage_year: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_tco2e: Mapped[Decimal] = mapped_column(NUMERIC(18, 4), nullable=False)
    price_per_tco2e: Mapped[Decimal] = mapped_column(NUMERIC(18, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(60), nullable=False, default="open")
    eligibility_tags: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MarketplaceOrderModel(Base):
    __tablename__ = "marketplace_orders"
    __table_args__ = {"schema": "market"}

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    listing_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    buyer_account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    quantity_tco2e: Mapped[Decimal] = mapped_column(NUMERIC(18, 4), nullable=False)
    status: Mapped[str] = mapped_column(String(60), nullable=False, default="pending_compliance_review")
    settlement_status: Mapped[str] = mapped_column(String(60), nullable=False, default="not_started")
    transaction_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionFactory() as session:
        yield session


# ---------------------------------------------------------------------------
# Auth middleware: validate token against carbon registry
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class PricePoint(BaseModel):
    credit_type: Literal["authorized", "non_authorized"]
    vintage_year: int
    project_type: str
    price_usd: float
    factors: dict
    confidence: float


class CreditListing(BaseModel):
    listing_id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    project_name: str
    seller_id: UUID
    vintage_year: int
    quantity_tco2e: float
    credit_type: Literal["authorized", "non_authorized"]
    project_type: str
    price_per_tco2e: float
    authorization_status: str
    scope: str
    listed_at: datetime = Field(default_factory=datetime.utcnow)


class MatchResult(BaseModel):
    match_id: UUID = Field(default_factory=uuid4)
    listing_id: UUID
    project_name: str
    host_country: str = "Zimbabwe"
    compatibility_score: float
    ndc_alignment_score: float
    scope_match: bool
    price_per_tco2e: float
    quantity_available: float
    authorization_status: str
    recommendation: str


class TradeResult(BaseModel):
    trade_id: UUID = Field(default_factory=uuid4)
    status: str
    transaction_hash: Optional[str]
    settlement_date: datetime
    total_value: float


class CreateListingRequest(BaseModel):
    project_id: UUID
    project_name: str
    seller_account_id: UUID
    vintage_year: int
    quantity_tco2e: float
    credit_type: Literal["authorized", "non_authorized"]
    project_type: str
    price_per_tco2e: float
    authorization_status: str
    scope: str


class TradeRequest(BaseModel):
    listing_id: UUID
    buyer_account_id: UUID
    quantity: float
    price_agreed: float
    payment_method: str = "bank_transfer"


# ---------------------------------------------------------------------------
# Pricing Engine
# ---------------------------------------------------------------------------
BASE_PRICES = {"authorized": 25.0, "non_authorized": 8.0}


def calculate_dynamic_price(credit_type: str, vintage: int, project_type: str) -> dict:
    base = BASE_PRICES.get(credit_type, 10.0)
    current_year = date.today().year
    age = current_year - vintage
    vintage_factor = max(0.7, 1.0 - (age * 0.05))
    demand_factor = 1.0 + (__import__("random").random() * 0.4 - 0.1)
    ndc_factor = 1.15 if credit_type == "authorized" else 1.0
    auth_premium = 1.4 if credit_type == "authorized" else 1.0
    final_price = base * vintage_factor * demand_factor * ndc_factor * auth_premium
    return {
        "price_usd": round(final_price, 2),
        "factors": {
            "base_price": base,
            "vintage_factor": round(vintage_factor, 2),
            "demand_factor": round(demand_factor, 2),
            "ndc_factor": round(ndc_factor, 2),
            "authorization_premium": round(auth_premium, 2),
        },
        "confidence": 0.85,
    }


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ZAI-CTS Marketplace Service",
    version="1.0.0",
    description="Smart Marketplace with Dynamic Pricing and Bilateral Matching",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "marketplace-service", "version": "1.0.0"}


@app.get("/api/v1/marketplace/pricing/current")
async def get_current_pricing(
    credit_type: Optional[str] = None,
    vintage_year: Optional[int] = None,
    project_type: Optional[str] = None,
):
    prices = []
    types = [credit_type] if credit_type else ["authorized", "non_authorized"]
    years = [vintage_year] if vintage_year else [2020, 2021, 2022, 2023, 2024]
    for ct in types:
        for year in years:
            calc = calculate_dynamic_price(ct, year, project_type or "forestry")
            prices.append(PricePoint(
                credit_type=ct,
                vintage_year=year,
                project_type=project_type or "forestry",
                price_usd=calc["price_usd"],
                factors=calc["factors"],
                confidence=calc["confidence"],
            ))
    return {"timestamp": datetime.utcnow().isoformat(), "prices": prices}


@app.post("/api/v1/marketplace/pricing/calculate")
async def calculate_price(request: dict):
    calc = calculate_dynamic_price(
        request.get("credit_type", "non_authorized"),
        request.get("vintage_year", 2024),
        request.get("project_type", "forestry"),
    )
    quantity = request.get("quantity", 1000)
    return {
        "calculated_price_usd": calc["price_usd"],
        "price_per_tco2e": calc["price_usd"],
        "total_value": round(calc["price_usd"] * quantity, 2),
        "factors": calc["factors"],
        "recommended_listing_price": round(calc["price_usd"] * 1.05, 2),
    }


# ---------------------------------------------------------------------------
# Listings (persisted to PostgreSQL)
# ---------------------------------------------------------------------------
@app.get("/api/v1/marketplace/listings")
async def get_listings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MarketplaceListingModel).where(MarketplaceListingModel.status == "open")
    )
    rows = result.scalars().all()
    listings = []
    for row in rows:
        listings.append({
            "listing_id": str(row.id),
            "project_id": str(row.project_id),
            "project_name": "Project " + str(row.project_id)[:8],
            "seller_id": str(row.seller_account_id),
            "vintage_year": row.vintage_year,
            "quantity_tco2e": float(row.quantity_tco2e),
            "credit_type": "authorized" if "authorized" in (row.eligibility_tags or {}) else "non_authorized",
            "project_type": "forestry",
            "price_per_tco2e": float(row.price_per_tco2e),
            "authorization_status": "approved",
            "scope": "scope_2",
            "listed_at": row.created_at.isoformat(),
        })
    return {"listings": listings, "total": len(listings)}


@app.post("/api/v1/marketplace/listings", status_code=status.HTTP_201_CREATED)
async def create_listing(
    request: CreateListingRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    listing = MarketplaceListingModel(
        id=uuid4(),
        seller_account_id=request.seller_account_id,
        project_id=request.project_id,
        vintage_year=request.vintage_year,
        quantity_tco2e=Decimal(str(request.quantity_tco2e)),
        price_per_tco2e=Decimal(str(request.price_per_tco2e)),
        status="open",
        eligibility_tags={"credit_type": request.credit_type},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return {"listing_id": str(listing.id), "status": "open"}


@app.post("/api/v1/marketplace/matching/find")
async def find_matches(request: dict, db: AsyncSession = Depends(get_db)):
    buyer_country = request.get("buyer_country", "Germany")
    target_scope = request.get("ndc_target", {}).get("target_type", "scope_2")
    result = await db.execute(
        select(MarketplaceListingModel).where(MarketplaceListingModel.status == "open")
    )
    rows = result.scalars().all()
    matches = []
    for listing in rows:
        scope_match = True  # simplified
        auth_match = listing.eligibility_tags.get("credit_type") == "authorized"
        compatibility = 0.5
        if scope_match:
            compatibility += 0.3
        if auth_match:
            compatibility += 0.2
        ndc_alignment = 0.85 if auth_match else 0.45
        matches.append(MatchResult(
            listing_id=listing.id,
            project_name="Project " + str(listing.project_id)[:8],
            compatibility_score=round(compatibility, 2),
            ndc_alignment_score=round(ndc_alignment, 2),
            scope_match=scope_match,
            price_per_tco2e=float(listing.price_per_tco2e),
            quantity_available=float(listing.quantity_tco2e),
            authorization_status="approved" if auth_match else "not_applicable",
            recommendation="High compatibility" if compatibility > 0.8 else "Moderate compatibility",
        ))
    matches.sort(key=lambda x: x.compatibility_score, reverse=True)
    return {
        "matches": [m.model_dump() for m in matches],
        "total_available": len(matches),
        "best_match": matches[0].model_dump() if matches else None,
    }


@app.post("/api/v1/marketplace/trades")
async def execute_trade(
    request: TradeRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_auth),
):
    # Validate listing exists and has enough quantity
    result = await db.execute(
        select(MarketplaceListingModel).where(MarketplaceListingModel.id == request.listing_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if float(listing.quantity_tco2e) < request.quantity:
        raise HTTPException(status_code=422, detail="Insufficient quantity available")

    # Deduct quantity from listing
    new_qty = float(listing.quantity_tco2e) - request.quantity
    listing.quantity_tco2e = Decimal(str(new_qty))
    if new_qty <= 0:
        listing.status = "closed"
    listing.updated_at = datetime.utcnow()

    # Create order record
    order = MarketplaceOrderModel(
        id=uuid4(),
        listing_id=request.listing_id,
        buyer_account_id=request.buyer_account_id,
        quantity_tco2e=Decimal(str(request.quantity)),
        status="completed",
        settlement_status="settled",
        transaction_hash=f"0x{uuid4().hex[:16]}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(order)
    await db.commit()

    return TradeResult(
        status="completed",
        transaction_hash=order.transaction_hash,
        settlement_date=datetime.utcnow(),
        total_value=request.quantity * request.price_agreed,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8106)

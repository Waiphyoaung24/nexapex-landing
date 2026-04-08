import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, hash_token
from app.auth.schemas import MeResponse, SignupRequest, SignupResponse
from app.db.database import get_db
from app.db.models import Lead
from app.dependencies import get_current_lead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED
)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(Lead).where(Lead.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    lead_id = uuid.uuid4()
    token = create_access_token(str(lead_id), req.email)

    lead = Lead(
        id=lead_id,
        email=req.email,
        name=req.name,
        company=req.company,
        industry=req.industry,
        token_hash=hash_token(token),
    )
    db.add(lead)
    await db.commit()

    return SignupResponse(
        id=str(lead.id),
        email=lead.email,
        name=lead.name,
        token=token,
        demos_remaining={"vision": 10, "chat": 20, "document": 5},
    )


@router.get("/me", response_model=MeResponse)
async def get_me(lead: Lead = Depends(get_current_lead)):
    return MeResponse(
        id=str(lead.id),
        email=lead.email,
        name=lead.name,
        company=lead.company,
        industry=lead.industry.value if lead.industry else None,
        is_approved=lead.is_approved,
    )

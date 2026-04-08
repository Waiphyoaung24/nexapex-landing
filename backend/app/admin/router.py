import bcrypt as _bcrypt

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    LeadRow,
    LeadsListResponse,
)
from app.auth.jwt import create_admin_token
from app.db.database import get_db
from app.db.models import AdminUser, Lead
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(req: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == req.email)
    )
    admin = result.scalar_one_or_none()

    if not admin or not _bcrypt.checkpw(
        req.password.encode(), admin.password_hash.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_admin_token(str(admin.id), admin.email, admin.role.value)
    return AdminLoginResponse(token=token, email=admin.email, role=admin.role.value)


@router.get("/leads", response_model=LeadsListResponse)
async def list_leads(
    filter_status: str = Query("all", alias="status"),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Lead).order_by(Lead.created_at.desc())

    if filter_status == "pending":
        query = query.where(Lead.is_approved == False)  # noqa: E712
    elif filter_status == "approved":
        query = query.where(Lead.is_approved == True)  # noqa: E712

    result = await db.execute(query)
    leads = result.scalars().all()

    count_result = await db.execute(select(func.count(Lead.id)))
    total = count_result.scalar() or 0

    return LeadsListResponse(
        leads=[
            LeadRow(
                id=str(lead.id),
                email=lead.email,
                name=lead.name,
                company=lead.company,
                industry=lead.industry.value if lead.industry else None,
                is_approved=lead.is_approved,
                created_at=lead.created_at.isoformat(),
            )
            for lead in leads
        ],
        total=total,
    )


@router.patch("/leads/{lead_id}/approve", status_code=status.HTTP_200_OK)
async def approve_lead(
    lead_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_approved = True
    await db.commit()
    return {"status": "approved", "lead_id": lead_id}

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Lead
from app.dependencies import get_current_lead
from app.vision.schemas import VisionResponse
from app.vision.service import run_inference

router = APIRouter(prefix="/vision", tags=["vision"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Optional auth — allows unauthenticated access for dev/demo testing
optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_lead(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> Lead | None:
    if credentials is None:
        return None
    from app.auth.jwt import verify_access_token

    payload = verify_access_token(credentials.credentials)
    if not payload:
        return None
    from sqlalchemy import select

    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    return result.scalar_one_or_none()


@router.post("/detect", response_model=VisionResponse)
async def detect(
    request: Request,
    image: Annotated[UploadFile, File(description="Image to analyze")],
    confidence_threshold: Annotated[float, Query(ge=0.1, le=1.0)] = 0.25,
    lead: Lead | None = Depends(get_optional_lead),
    db: AsyncSession = Depends(get_db),
) -> VisionResponse:
    # Check demo limit (only if authenticated)
    if lead and lead.vision_demos_used >= 10:
        raise HTTPException(
            status_code=429,
            detail="Demo limit reached. Book a consultation to continue.",
        )

    # Validate content type
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Use JPEG, PNG, or WebP.",
        )

    # Read and validate size
    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum 10MB.",
        )

    # Check model is loaded
    yolo_model = getattr(request.app.state, "yolo_model", None)
    if yolo_model is None:
        raise HTTPException(
            status_code=503,
            detail="Vision model not available. Please try again later.",
        )

    # Run inference
    result = run_inference(yolo_model, contents, confidence_threshold)

    # Increment usage counter (only if authenticated)
    demos_remaining = 10
    if lead:
        await db.execute(
            update(Lead)
            .where(Lead.id == lead.id)
            .values(vision_demos_used=Lead.vision_demos_used + 1)
        )
        await db.commit()
        demos_remaining = max(0, 10 - lead.vision_demos_used - 1)

    return VisionResponse(
        **result,
        demos_remaining=demos_remaining,
    )

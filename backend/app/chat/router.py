from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterable

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.sse import EventSourceResponse, format_sse_event
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.schemas import ChatRequest
from app.chat.service import stream_chat
from app.db.database import get_db
from app.db.models import Lead

router = APIRouter(prefix="/chat", tags=["chat"])

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
    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    return result.scalar_one_or_none()


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    request: Request,
    lead: Lead | None = Depends(get_optional_lead),
    db: AsyncSession = Depends(get_db),
):
    # Check model is loaded
    llm = getattr(request.app.state, "llm", None)
    if llm is None:
        raise HTTPException(503, "Chat model not available")

    # Check demo limit (only if authenticated)
    if lead and lead.chat_demos_used >= 20:
        raise HTTPException(429, "Demo limit reached. Book a consultation to continue.")

    conversation_id = str(uuid.uuid4())
    messages = [m.model_dump() for m in body.messages]

    async def generate():
        async for event in stream_chat(llm, messages, body.language, conversation_id):
            yield event

        # Increment usage after stream completes
        demos_remaining = 20
        if lead:
            await db.execute(
                update(Lead)
                .where(Lead.id == lead.id)
                .values(chat_demos_used=Lead.chat_demos_used + 1)
            )
            await db.commit()
            demos_remaining = max(0, 20 - lead.chat_demos_used - 1)

        yield format_sse_event(
            data_str=json.dumps({
                "conversation_id": conversation_id,
                "demos_remaining": demos_remaining,
            }),
            event="done",
        )

    return EventSourceResponse(
        generate(),
        headers={"X-Accel-Buffering": "no"},
    )

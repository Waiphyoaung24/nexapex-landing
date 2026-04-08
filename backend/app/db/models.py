import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Industry(str, enum.Enum):
    manufacturing = "manufacturing"
    fnb = "fnb"
    retail = "retail"
    agriculture = "agriculture"
    technology = "technology"
    other = "other"


class DemoType(str, enum.Enum):
    vision = "vision"
    chat = "chat"
    document = "document"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class AdminRole(str, enum.Enum):
    admin = "admin"
    viewer = "viewer"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    company: Mapped[str | None] = mapped_column(String(200))
    industry: Mapped[Industry | None] = mapped_column(SAEnum(Industry))
    token_hash: Mapped[str] = mapped_column(String(64))
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    vision_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    chat_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    doc_demos_used: Mapped[int] = mapped_column(Integer, default=0)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    sessions: Mapped[list["DemoSession"]] = relationship(back_populates="lead")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="lead")


class DemoSession(Base):
    __tablename__ = "demo_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    demo_type: Mapped[DemoType] = mapped_column(SAEnum(DemoType))
    input_metadata: Mapped[dict | None] = mapped_column(JSONB)
    result_summary: Mapped[dict | None] = mapped_column(JSONB)
    processing_time_ms: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship(back_populates="sessions")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    timezone: Mapped[str] = mapped_column(String(50))
    problem_description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus), default=BookingStatus.pending
    )
    calendar_event_id: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship(back_populates="bookings")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    totp_secret: Mapped[str | None] = mapped_column(String(32))
    role: Mapped[AdminRole] = mapped_column(
        SAEnum(AdminRole), default=AdminRole.viewer
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

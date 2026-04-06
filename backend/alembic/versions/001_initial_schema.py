"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("company", sa.String(200), nullable=True),
        sa.Column(
            "industry",
            sa.Enum(
                "manufacturing", "fnb", "retail", "agriculture", "technology", "other",
                name="industry",
            ),
            nullable=True,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("vision_demos_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("chat_demos_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("doc_demos_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_active_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "demo_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lead_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("leads.id"),
            index=True,
            nullable=False,
        ),
        sa.Column(
            "demo_type",
            sa.Enum("vision", "chat", "document", name="demotype"),
            nullable=False,
        ),
        sa.Column("input_metadata", postgresql.JSONB(), nullable=True),
        sa.Column("result_summary", postgresql.JSONB(), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lead_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("leads.id"),
            index=True,
            nullable=False,
        ),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("timezone", sa.String(50), nullable=False),
        sa.Column("problem_description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "confirmed", "completed", "cancelled",
                name="bookingstatus",
            ),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("calendar_event_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("totp_secret", sa.String(32), nullable=True),
        sa.Column(
            "role",
            sa.Enum("admin", "viewer", name="adminrole"),
            server_default="viewer",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("admin_users")
    op.drop_table("bookings")
    op.drop_table("demo_sessions")
    op.drop_table("leads")
    op.execute("DROP TYPE IF EXISTS adminrole")
    op.execute("DROP TYPE IF EXISTS bookingstatus")
    op.execute("DROP TYPE IF EXISTS demotype")
    op.execute("DROP TYPE IF EXISTS industry")

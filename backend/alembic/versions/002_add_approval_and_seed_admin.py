"""Add is_approved to leads and seed super admin.

Revision ID: 002
Revises: 001
"""

import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_approved column
    op.add_column(
        "leads",
        sa.Column(
            "is_approved",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Seed super admin
    import bcrypt as _bcrypt

    password_hash = _bcrypt.hashpw(
        b"NexusLabDev321!", _bcrypt.gensalt()
    ).decode()

    op.execute(
        sa.text(
            "INSERT INTO admin_users (id, email, password_hash, role, created_at) "
            "VALUES (CAST(:id AS uuid), :email, :password_hash, CAST(:role AS adminrole), :created_at)"
        ).bindparams(
            id=str(uuid.uuid4()),
            email="nexuslab.dev.mm@gmail.com",
            password_hash=password_hash,
            role="admin",
            created_at=datetime.now(timezone.utc),
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM admin_users WHERE email = 'nexuslab.dev.mm@gmail.com'"
        )
    )
    op.drop_column("leads", "is_approved")

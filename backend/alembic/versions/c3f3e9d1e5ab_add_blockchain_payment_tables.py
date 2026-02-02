"""add blockchain and payment tracking tables

Revision ID: c3f3e9d1e5ab
Revises: b8f3f5a9d123
Create Date: 2025-02-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3f3e9d1e5ab"
down_revision = "b8f3f5a9d123"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "blockchain_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=False, unique=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "payment_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("listing_id", sa.Integer(), sa.ForeignKey("listings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="usd"),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("provider", sa.String(length=64), nullable=False, server_default="402pay"),
        sa.Column("provider_reference", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("payment_records")
    op.drop_table("blockchain_transactions")

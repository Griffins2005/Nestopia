"""Add latitude/longitude to listings for map pins."""

from alembic import op
import sqlalchemy as sa

revision = "d4e8f1a2b3c4"
down_revision = "c3f3e9d1e5ab"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("listings", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("listings", sa.Column("longitude", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("listings", "longitude")
    op.drop_column("listings", "latitude")

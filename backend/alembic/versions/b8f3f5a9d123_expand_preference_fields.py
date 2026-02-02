"""expand renter and landlord preference fields

Revision ID: b8f3f5a9d123
Revises: 9e7e0e35a411
Create Date: 2025-11-17 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b8f3f5a9d123"
down_revision = "9e7e0e35a411"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    dialect = bind.dialect.name

    def table_exists(name: str) -> bool:
        return name in inspector.get_table_names()

    def has_column(table: str, column: str) -> bool:
        if not table_exists(table):
            return False
        return column in {col["name"] for col in inspector.get_columns(table)}

    if table_exists("renter_preferences"):
        if not has_column("renter_preferences", "household_size"):
            op.add_column("renter_preferences", sa.Column("household_size", sa.Integer(), nullable=False, server_default="1"))
        if not has_column("renter_preferences", "building_amenities"):
            op.add_column("renter_preferences", sa.Column("building_amenities", sa.JSON(), nullable=True))
        if not has_column("renter_preferences", "smoking_preference"):
            op.add_column("renter_preferences", sa.Column("smoking_preference", sa.String(length=32), nullable=True))
        if not has_column("renter_preferences", "noise_tolerance"):
            op.add_column("renter_preferences", sa.Column("noise_tolerance", sa.String(length=32), nullable=True))
        if not has_column("renter_preferences", "visitor_flexibility"):
            op.add_column("renter_preferences", sa.Column("visitor_flexibility", sa.String(length=32), nullable=True))
        if not has_column("renter_preferences", "custom_preferences"):
            op.add_column("renter_preferences", sa.Column("custom_preferences", sa.JSON(), nullable=True))

    if table_exists("landlord_preferences") and not has_column("landlord_preferences", "custom_requirements"):
        op.add_column("landlord_preferences", sa.Column("custom_requirements", sa.JSON(), nullable=True))

    if table_exists("listings"):
        if not has_column("listings", "neighborhood_profile"):
            op.add_column("listings", sa.Column("neighborhood_profile", sa.JSON(), nullable=True))
        if not has_column("listings", "custom_tags"):
            op.add_column("listings", sa.Column("custom_tags", sa.JSON(), nullable=True))

    if dialect != "sqlite" and table_exists("renter_preferences") and has_column("renter_preferences", "household_size"):
        op.alter_column("renter_preferences", "household_size", server_default=None)


def downgrade():
    op.drop_column("listings", "custom_tags")
    op.drop_column("listings", "neighborhood_profile")
    op.drop_column("landlord_preferences", "custom_requirements")
    op.drop_column("renter_preferences", "custom_preferences")
    op.drop_column("renter_preferences", "visitor_flexibility")
    op.drop_column("renter_preferences", "noise_tolerance")
    op.drop_column("renter_preferences", "smoking_preference")
    op.drop_column("renter_preferences", "building_amenities")
    op.drop_column("renter_preferences", "household_size")


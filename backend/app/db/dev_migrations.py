"""Upgrade SQLite dev DB when new columns are added outside Alembic."""
import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def ensure_user_security_columns(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("users")}
    statements = []
    if "totp_secret" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64)")
    if "totp_enabled" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT 0"
        )
    if "contact_preference" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN contact_preference VARCHAR(10) NOT NULL DEFAULT 'any'"
        )
    with engine.begin() as conn:
        for stmt in statements:
            logger.info("Applying dev migration: %s", stmt)
            conn.execute(text(stmt))
        if "contact_preference" in {col["name"] for col in inspector.get_columns("users")}:
            conn.execute(text("UPDATE users SET contact_preference = 'text' WHERE contact_preference = 'phone'"))
            conn.execute(text("UPDATE users SET contact_preference = 'any' WHERE contact_preference NOT IN ('any', 'text', 'email')"))


def ensure_listing_tenant_columns(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return
    inspector = inspect(engine)
    if "listings" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("listings")}
    statements = []
    if "tenant_preferences" not in columns:
        statements.append("ALTER TABLE listings ADD COLUMN tenant_preferences JSON")
    if "tenant_custom_requirements" not in columns:
        statements.append("ALTER TABLE listings ADD COLUMN tenant_custom_requirements JSON")
    with engine.begin() as conn:
        for stmt in statements:
            logger.info("Applying dev migration: %s", stmt)
            conn.execute(text(stmt))

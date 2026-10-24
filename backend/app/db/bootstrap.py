"""Prepare Postgres before the API listens.

The Alembic history alters tables that were created outside these revisions.
On an empty database those upgrades fail immediately. Create the current
schema from the models, then stamp Alembic at head. Later deploys only run
new revisions.
"""
import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.db.models import Base
from app.db.session import engine

logger = logging.getLogger(__name__)


def _alembic_config() -> Config:
    root = Path(__file__).resolve().parents[2]
    return Config(str(root / "alembic.ini"))


def prepare_database() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    config = _alembic_config()
    if "users" in tables:
        logger.info("Existing schema found; applying Alembic upgrades")
        command.upgrade(config, "head")
        return
    logger.info("Empty database; creating tables from models")
    Base.metadata.create_all(bind=engine)
    command.stamp(config, "head")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    prepare_database()

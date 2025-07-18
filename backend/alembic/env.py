from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.db.session import SQLALCHEMY_DATABASE_URL
from app.db.models import Base

def get_url():
    return os.getenv("DATABASE_URL", SQLALCHEMY_DATABASE_URL)

config = context.config
fileConfig(config.config_file_name)
config.set_main_option("sqlalchemy.url", get_url())

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
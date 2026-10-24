#!/bin/sh
set -e
# Create the schema, or apply Alembic revisions when one already exists.
python -m app.db.bootstrap
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

#!/bin/sh
set -e
# Apply schema changes before the process starts listening.
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

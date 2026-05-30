"""Normalize and validate DATABASE_URL for SQLAlchemy (Railway Postgres, local SQLite)."""
from __future__ import annotations

import os
import re
from urllib.parse import quote_plus, unquote, urlparse, urlunparse


def _encode_password_in_url(url: str) -> str:
    if "://" not in url or "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    userinfo, hostpart = rest.rsplit("@", 1)
    if ":" not in userinfo:
        return url
    user, password = userinfo.split(":", 1)
    if not password or re.search(r"[%@/?#]", password):
        password = quote_plus(unquote(password))
    return f"{scheme}://{user}:{password}@{hostpart}"


def _to_sqlalchemy_driver(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg2" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _verify_parseable(url: str) -> str:
    from sqlalchemy.engine.url import make_url

    make_url(url)
    return url


def normalize_database_url(raw: str | None) -> str:
    value = (raw or "").strip().strip('"').strip("'")
    on_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PUBLIC_DOMAIN"))

    if not value:
        raise ValueError(
            "DATABASE_URL is missing. On Railway: add PostgreSQL to the project, open your "
            "API service → Variables → Add Variable → Reference → select Postgres → DATABASE_URL."
        )

    if "${" in value:
        raise ValueError(
            f"DATABASE_URL looks unresolved ({value!r}). In Railway, use the Reference picker "
            "to link Postgres — do not paste ${{Postgres.DATABASE_URL}} as plain text."
        )

    if on_railway and "sqlite" in value.lower():
        raise ValueError(
            "SQLite does not work on Railway. Remove sqlite DATABASE_URL and reference "
            "PostgreSQL instead."
        )

    url = _to_sqlalchemy_driver(value)
    try:
        return _verify_parseable(url)
    except Exception:
        url = _encode_password_in_url(url)
        try:
            return _verify_parseable(url)
        except Exception as exc:
            raise ValueError(
                "DATABASE_URL could not be parsed for SQLAlchemy. On Railway, open your API "
                "service Variables and ensure DATABASE_URL references the Postgres plugin "
                f"(not sqlite or localhost). Detail: {exc}"
            ) from exc


def resolve_database_url_from_env(explicit: str | None = None) -> str:
    """Prefer explicit settings value, then standard Railway / Postgres env names."""
    candidates = [
        explicit,
        os.environ.get("DATABASE_URL"),
        os.environ.get("DATABASE_PRIVATE_URL"),
        os.environ.get("POSTGRES_URL"),
    ]
    pg_user = os.environ.get("PGUSER") or os.environ.get("POSTGRES_USER")
    pg_pass = os.environ.get("PGPASSWORD") or os.environ.get("POSTGRES_PASSWORD")
    pg_host = os.environ.get("PGHOST") or os.environ.get("POSTGRES_HOST")
    pg_port = os.environ.get("PGPORT") or os.environ.get("POSTGRES_PORT") or "5432"
    pg_db = os.environ.get("PGDATABASE") or os.environ.get("POSTGRES_DB")
    if pg_user and pg_pass and pg_host and pg_db:
        built = (
            f"postgresql+psycopg2://{quote_plus(pg_user)}:{quote_plus(pg_pass)}"
            f"@{pg_host}:{pg_port}/{pg_db}"
        )
        candidates.append(built)

    for candidate in candidates:
        if candidate and str(candidate).strip():
            return normalize_database_url(str(candidate))
    return normalize_database_url("")

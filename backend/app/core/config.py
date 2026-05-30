# app/core/config.py
import os
from typing import List, Optional

from pydantic import BaseSettings, root_validator, validator

from app.core.db_url import normalize_database_url, resolve_database_url_from_env

_PLACEHOLDER_SECRETS = {
    "change-me-long-random-string",
    "change-me-session-secret",
    "your_super_secret_key",
    "dev-secret-change-in-production",
    "dev-session-secret-change-in-production",
}


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:3000"
    APP_NAME: str = "Nestopia"
    USE_ML_MATCHING: bool = False
    USE_SEMANTIC_MATCHING: bool = False

    # Comma-separated browser origins (e.g. https://nestopia.vercel.app)
    CORS_ORIGINS: str = "http://localhost:3000"
    API_PUBLIC_URL: Optional[str] = None

    PAYMENT_PROVIDER: str = "402pay"
    PAYMENT_API_KEY: Optional[str] = None
    PAYMENT_WEBHOOK_SECRET: Optional[str] = None

    H402_ENABLED: bool = True
    H402_FACILITATOR_URL: str = "http://localhost:9402"
    H402_NAMESPACE: str = "evm"
    H402_NETWORK_ID: str = "56"
    H402_TOKEN_ADDRESS: str = "0x55d398326f99059ff775485246999027b3197955"
    H402_TOKEN_SYMBOL: str = "USDT"
    H402_TOKEN_DECIMALS: int = 6
    H402_AMOUNT_FORMAT: str = "humanReadable"
    H402_PAY_TO_ADDRESS: str = "0xd78d20FB910794df939eB2A758B367d7224733bc"
    H402_RPC_URL: Optional[str] = None
    H402_CHAIN_NAME: str = "Binance Smart Chain"
    H402_RESOURCE_BASE: Optional[str] = None

    REDIS_URL: str = "redis://localhost:6379/0"

    GOOGLE_CLIENT_ID: str = "local-dev.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "local-dev-secret"

    SESSION_SECRET_KEY: str = "your_super_secret_key"
    PASSWORD_RESET_TOKEN_MINUTES: int = 30

    AUTH_COOKIE_NAME: str = "nestopia_session"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    GOOGLE_REDIRECT_URI: Optional[str] = None

    class Config:
        env_file = ".env"

    @validator("ACCESS_TOKEN_EXPIRE_MINUTES", pre=True)
    def cast_to_int(cls, v):
        return int(v)

    @root_validator(pre=True)
    def resolve_database_url(cls, values):
        explicit = values.get("DATABASE_URL") or None
        values["DATABASE_URL"] = resolve_database_url_from_env(explicit)
        return values

    @validator("COOKIE_SAMESITE", pre=True)
    def normalize_samesite(cls, v):
        if v is None:
            return "lax"
        return str(v).lower()

    @validator("USE_ML_MATCHING", "USE_SEMANTIC_MATCHING", pre=True)
    def parse_bool(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.strip().lower() in {"1", "true", "yes", "on"}
        return bool(v)

    @root_validator
    def apply_platform_defaults(cls, values):
        db = (values.get("DATABASE_URL") or "").lower()
        on_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PUBLIC_DOMAIN"))

        if on_railway and "sqlite" in db:
            raise ValueError(
                "SQLite does not work on Railway. Add PostgreSQL in Railway, then set "
                "DATABASE_URL=${{Postgres.DATABASE_URL}} on this service."
            )

        is_postgres = "postgres" in db
        if is_postgres or on_railway:
            for key in ("SECRET_KEY", "SESSION_SECRET_KEY"):
                val = values.get(key) or ""
                if val in _PLACEHOLDER_SECRETS or len(val) < 32:
                    raise ValueError(
                        f"{key} must be a random string (32+ chars) in production. "
                        'Generate: python -c "import secrets; print(secrets.token_urlsafe(48))"'
                    )

        railway_host = os.getenv("RAILWAY_PUBLIC_DOMAIN")
        if railway_host and not values.get("API_PUBLIC_URL"):
            values["API_PUBLIC_URL"] = f"https://{railway_host}"

        frontend = (values.get("FRONTEND_URL") or "").strip().rstrip("/")
        api_public = (values.get("API_PUBLIC_URL") or "").strip().rstrip("/")

        if frontend.startswith("https://"):
            values["COOKIE_SECURE"] = True

        if (
            frontend.startswith("https://")
            and api_public.startswith("https://")
            and api_public != frontend
        ):
            values["COOKIE_SAMESITE"] = "none"

        return values

    def cors_origins_list(self) -> List[str]:
        origins = [o.strip() for o in (self.CORS_ORIGINS or "").split(",") if o.strip()]
        frontend = (self.FRONTEND_URL or "").strip()
        if frontend and frontend not in origins:
            origins.append(frontend)
        return origins or ["http://localhost:3000"]

    def google_redirect_uri(self) -> str:
        if self.GOOGLE_REDIRECT_URI:
            return self.GOOGLE_REDIRECT_URI
        base = (self.API_PUBLIC_URL or self.FRONTEND_URL).rstrip("/")
        return f"{base}/api/auth/google/callback"


settings = Settings()

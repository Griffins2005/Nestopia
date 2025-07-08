# app/core/config.py
from pydantic import validator  , BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:3000"

    @validator("ACCESS_TOKEN_EXPIRE_MINUTES", pre=True)
    def cast_to_int(cls, v):
        return int(v)

    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PUBLISHABLE_KEY: str

    REDIS_URL: str = "redis://localhost:6379/0"  # for Celery

    # OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    SESSION_SECRET_KEY: str = "your_super_secret_key"

    class Config:
        env_file = ".env"

settings = Settings()

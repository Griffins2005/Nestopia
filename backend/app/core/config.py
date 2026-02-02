# app/core/config.py
from typing import Optional
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:3000"
    USE_ML_MATCHING: bool = True
    USE_SEMANTIC_MATCHING: bool = False

    @validator("ACCESS_TOKEN_EXPIRE_MINUTES", pre=True)
    def cast_to_int(cls, v):
        return int(v)

    PAYMENT_PROVIDER: str = "402pay"
    PAYMENT_API_KEY: Optional[str] = None
    PAYMENT_WEBHOOK_SECRET: Optional[str] = None

    H402_ENABLED: bool = True
    H402_FACILITATOR_URL: str = "http://localhost:9402"
    H402_NAMESPACE: str = "evm"
    H402_NETWORK_ID: str = "56"
    H402_TOKEN_ADDRESS: str = "0x55d398326f99059ff775485246999027b3197955"  # USDT on BSC
    H402_TOKEN_SYMBOL: str = "USDT"
    H402_TOKEN_DECIMALS: int = 6
    H402_AMOUNT_FORMAT: str = "humanReadable"
    H402_PAY_TO_ADDRESS: str = "0xd78d20FB910794df939eB2A758B367d7224733bc"
    H402_RPC_URL: Optional[str] = None
    H402_CHAIN_NAME: str = "Binance Smart Chain"
    H402_RESOURCE_BASE: Optional[str] = None

    REDIS_URL: str = "redis://localhost:6379/0"  # for Celery

    # OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    SESSION_SECRET_KEY: str = "your_super_secret_key"
    PASSWORD_RESET_TOKEN_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()

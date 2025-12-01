# app/schemas/wallet.py
from pydantic import BaseModel, constr
from typing import Optional


class WalletConnectRequest(BaseModel):
    address: constr(strip_whitespace=True, min_length=6)
    provider: Optional[str] = "metamask"


class WalletResponse(BaseModel):
    address: str
    provider: Optional[str] = None
    verified: bool = True

    class Config:
        orm_mode = True

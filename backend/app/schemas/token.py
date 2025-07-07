# app/schemas/token.py
from pydantic import BaseModel
from datetime import datetime

class TokenTransactionOut(BaseModel):
    id: int
    user_id: int
    amount: int
    reason: str
    created_at: datetime
    class Config:
        orm_mode = True

# app/schemas/blockchain.py
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ScheduleVisitRequest(BaseModel):
    listing_id: int
    slot_time: datetime
    notes: Optional[str] = None


class DepositRequest(BaseModel):
    listing_id: Optional[int] = None
    amount: float = Field(gt=0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BlockchainTransactionOut(BaseModel):
    id: int
    listing_id: Optional[int]
    action: str
    tx_hash: str
    status: str
    payload: Dict[str, Any]
    created_at: datetime

    class Config:
        orm_mode = True

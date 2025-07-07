# app/schemas/payment.py
from pydantic import BaseModel
from typing import Dict

class CreatePaymentIntentRequest(BaseModel):
    amount: int
    currency: str
    metadata: Dict[str, str]

class PaymentIntentResponse(BaseModel):
    clientSecret: str

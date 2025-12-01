# app/schemas/payment.py
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, root_validator, validator


class PaymentRequirement(BaseModel):
    namespace: str = "evm"
    scheme: str = "exact"
    networkId: str
    tokenAddress: str
    tokenSymbol: str
    tokenDecimals: int
    amountRequired: float
    amountRequiredFormat: str = "humanReadable"
    payToAddress: str
    description: Optional[str] = None
    resource: Optional[str] = None
    mimeType: Optional[str] = None
    outputSchema: Optional[Dict[str, Any]] = None
    estimatedProcessingTime: Optional[int] = None
    extra: Dict[str, Any] = Field(default_factory=dict)
    maxAmountRequired: Optional[float] = None
    requiredDeadlineSeconds: Optional[int] = None


class PaymentInitiateRequest(BaseModel):
    amount: int = Field(gt=0, description="Amount in the smallest fiat unit (e.g., cents)")
    currency: str = "usd"
    description: Optional[str] = None
    listing_id: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    provider: str = "402pay"
    token_amount_override: Optional[float] = Field(
        default=None,
        description="Optional override for the stablecoin amount (human readable)",
    )

    @validator("currency")
    def normalize_currency(cls, value: str) -> str:
        return value.lower()


class PaymentInitiateResponse(BaseModel):
    payment: "PaymentRecordOut"
    payment_requirements: PaymentRequirement


class PaymentConfirmRequest(BaseModel):
    payment_id: int
    payment_header: str

    @root_validator
    def strip_header(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        header = values.get("payment_header")
        if header:
            values["payment_header"] = header.strip()
        return values


class PaymentRecordOut(BaseModel):
    id: int
    amount: int
    currency: str
    description: Optional[str]
    provider: str
    provider_reference: Optional[str]
    status: str
    listing_id: Optional[int]
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="metadata_json")
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


PaymentInitiateResponse.update_forward_refs()

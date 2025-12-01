"""402pay-compatible payment endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.payment import (
    create_payment_record,
    get_payment_record,
    list_user_payments,
    update_payment_status,
)
from app.dependencies import get_current_user, get_db
from app.schemas.payment import (
    PaymentConfirmRequest,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentRecordOut,
    PaymentRequirement,
)
from app.services.h402_client import (
    H402IntegrationError,
    build_payment_requirements,
    verify_payment_header,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentInitiateResponse)
def initiate_payment(
    payload: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Create a payment intent and return the h402 payment requirement payload."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    record = create_payment_record(
        db,
        user_id=user.id,
        amount=payload.amount,
        currency=payload.currency,
        description=payload.description,
        provider=payload.provider or "402pay",
        listing_id=payload.listing_id,
        metadata=payload.metadata,
    )

    try:
        requirement = build_payment_requirements(payload, payment=record)
    except H402IntegrationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    update_payment_status(
        db,
        record.id,
        status="pending",
        metadata={"h402_requirement": requirement.dict(exclude_none=True)},
    )
    db.refresh(record)

    return PaymentInitiateResponse(payment=record, payment_requirements=requirement)


@router.post("/confirm", response_model=PaymentRecordOut)
def confirm_payment(
    payload: PaymentConfirmRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Verify a signed h402 payment header with the facilitator."""
    record = get_payment_record(db, payload.payment_id, user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Payment not found")
    if record.status == "completed":
        return record

    requirement_data = (record.metadata_json or {}).get("h402_requirement")
    if not requirement_data:
        raise HTTPException(status_code=400, detail="Missing payment requirements")

    try:
        requirement = PaymentRequirement(**requirement_data)
        verification = verify_payment_header(payload.payment_header, requirement)
    except H402IntegrationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    provider_ref = verification.get("txHash") or verification.get("payer")
    metadata_updates = {
        "verification": verification,
    }
    record = update_payment_status(
        db,
        record.id,
        status="completed",
        provider_reference=provider_ref,
        metadata=metadata_updates,
    )
    return record


@router.get("", response_model=List[PaymentRecordOut])
def payment_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Return the authenticated user's payment receipts."""
    return list_user_payments(db, user.id)


@router.get("/{payment_id}", response_model=PaymentRecordOut)
def payment_detail(
    payment_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Fetch a single payment receipt, ensuring owner access."""
    record = get_payment_record(db, payment_id, user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Payment not found")
    return record


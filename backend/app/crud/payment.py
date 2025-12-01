# app/crud/payment.py
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.db.models import PaymentRecord


def create_payment_record(
    db: Session,
    *,
    user_id: int,
    amount: int,
    currency: str,
    description: Optional[str],
    provider: str,
    listing_id: Optional[int],
    metadata: Optional[Dict[str, Any]] = None,
) -> PaymentRecord:
    record = PaymentRecord(
        user_id=user_id,
        listing_id=listing_id,
        amount=amount,
        currency=currency,
        description=description,
        provider=provider,
        metadata_json=metadata or {},
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_payment_status(
    db: Session,
    payment_id: int,
    *,
    status: str,
    provider_reference: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> PaymentRecord:
    record = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    if not record:
        return None
    record.status = status
    if provider_reference:
        record.provider_reference = provider_reference
    if metadata:
        merged = record.metadata_json or {}
        merged.update(metadata)
        record.metadata_json = merged
    db.commit()
    db.refresh(record)
    return record


def list_user_payments(db: Session, user_id: int) -> List[PaymentRecord]:
    return (
        db.query(PaymentRecord)
        .filter(PaymentRecord.user_id == user_id)
        .order_by(PaymentRecord.created_at.desc())
        .all()
    )


def get_payment_record(db: Session, payment_id: int, user_id: int) -> Optional[PaymentRecord]:
    return (
        db.query(PaymentRecord)
        .filter(PaymentRecord.id == payment_id, PaymentRecord.user_id == user_id)
        .first()
    )

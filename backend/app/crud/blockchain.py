# app/crud/blockchain.py
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from uuid import uuid4
from app.db.models import BlockchainTransaction


def create_blockchain_transaction(
    db: Session,
    *,
    user_id: int,
    listing_id: Optional[int],
    action: str,
    payload: Optional[Dict[str, Any]] = None,
    status: str = "pending",
) -> BlockchainTransaction:
    tx = BlockchainTransaction(
        user_id=user_id,
        listing_id=listing_id,
        action=action,
        tx_hash=f"0x{uuid4().hex}",
        status=status,
        payload=payload or {},
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def mark_transaction_status(
    db: Session,
    tx_id: int,
    *,
    status: str,
    payload_updates: Optional[Dict[str, Any]] = None,
) -> Optional[BlockchainTransaction]:
    tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.id == tx_id).first()
    if not tx:
        return None
    tx.status = status
    if payload_updates:
        combined = tx.payload or {}
        combined.update(payload_updates)
        tx.payload = combined
    db.commit()
    db.refresh(tx)
    return tx


def list_transactions_for_user(db: Session, user_id: int) -> List[BlockchainTransaction]:
    return (
        db.query(BlockchainTransaction)
        .filter(BlockchainTransaction.user_id == user_id)
        .order_by(BlockchainTransaction.created_at.desc())
        .all()
    )

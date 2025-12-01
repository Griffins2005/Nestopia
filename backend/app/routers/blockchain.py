from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.dependencies import get_current_user, get_db
from app.schemas.blockchain import (
    ScheduleVisitRequest,
    DepositRequest,
    BlockchainTransactionOut,
)
from app.crud.blockchain import (
    create_blockchain_transaction,
    list_transactions_for_user,
    mark_transaction_status,
)

router = APIRouter(prefix="/api/blockchain", tags=["blockchain"])


@router.post("/schedule-visit", response_model=BlockchainTransactionOut)
def schedule_visit(
    payload: ScheduleVisitRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    tx = create_blockchain_transaction(
        db,
        user_id=user.id,
        listing_id=payload.listing_id,
        action="schedule_visit",
        payload={
            "slot_time": payload.slot_time.isoformat(),
            "notes": payload.notes or "",
        },
        status="pending",
    )
    mark_transaction_status(db, tx.id, status="confirmed")
    return tx


@router.post("/deposit", response_model=BlockchainTransactionOut)
def pay_deposit(
    payload: DepositRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    tx = create_blockchain_transaction(
        db,
        user_id=user.id,
        listing_id=payload.listing_id,
        action="deposit",
        payload={"amount": payload.amount, "metadata": payload.metadata},
        status="pending",
    )
    mark_transaction_status(db, tx.id, status="confirmed")
    return tx


@router.get("/transactions", response_model=List[BlockchainTransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return list_transactions_for_user(db, user.id)

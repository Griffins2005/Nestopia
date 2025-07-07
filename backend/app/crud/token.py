# app/crud/token.py
from sqlalchemy.orm import Session
from app.db import models

def get_token_balance(db: Session, user_id: int) -> int:
    token = db.query(models.Token).filter_by(user_id=user_id).first()
    return token.balance if token else 0

def spend_tokens(db: Session, user_id: int, amount: int, reason: str):
    token = db.query(models.Token).filter_by(user_id=user_id).first()
    if not token or token.balance < amount:
        raise Exception("Insufficient tokens")
    token.balance -= amount
    db.add(models.TokenTransaction(user_id=user_id, amount=-amount, reason=reason))
    db.commit()
    return token.balance

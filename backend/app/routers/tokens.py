# app/routers/tokens.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud.token import get_token_balance, spend_tokens
from app.db.session import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/tokens", tags=["Tokens"])

@router.get("/balance/", response_model=int)
def token_balance(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_token_balance(db, user_id=current_user.id)

@router.post("/spend/")
def spend_token(amount: int, reason: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        new_balance = spend_tokens(db, user_id=current_user.id, amount=amount, reason=reason)
        return {"new_balance": new_balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

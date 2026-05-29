from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import JWTError
from typing import Optional

from app.core.security import decode_access_token
from app.core.cookies import extract_access_token
from app.db.session import SessionLocal
from app.crud.user import get_user_by_id


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _user_from_token(token: str, db: Session):
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again.",
        )
    user = get_user_by_id(db, payload.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = extract_access_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _user_from_token(token, db)


def get_optional_user(request: Request, db: Session = Depends(get_db)):
    """Optional authentication — returns None when no valid session."""
    token = extract_access_token(request)
    if not token:
        return None
    try:
        return _user_from_token(token, db)
    except HTTPException:
        return None

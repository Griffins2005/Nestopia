from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.crud.user import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token or token == "undefined" or token == "null":
        raise HTTPException(status_code=401, detail="No token provided")
    payload = decode_access_token(token)
    user = get_user_by_id(db, payload.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

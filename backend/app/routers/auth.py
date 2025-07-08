# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.auth import SignUpRequest, LoginRequest, Token as TokenSchema
from app.crud import user as crud_user
from app.core.security import create_access_token, verify_password
from app.dependencies import get_db
from app.db.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _login_and_return_token(user):
    access_token = create_access_token(data={"user_id": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup", response_model=TokenSchema)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    if not data.role:
        raise HTTPException(400, "Role is required")
    existing = crud_user.get_user_by_email_and_role(db, data.email, data.role)
    if existing:
        if existing.auth_method == "google":
            raise HTTPException(403, detail="google_only")
        raise HTTPException(400, detail="User already exists")
    user = crud_user.create_user(db, data.email, data.password, data.role, method="email")
    return _login_and_return_token(user)

@router.post("/login", response_model=TokenSchema)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if not data.role:
        raise HTTPException(400, "Role is required")
    user = crud_user.get_user_by_email_and_role(db, data.email, data.role)
    if not user:
        raise HTTPException(404, detail="No account is associated with that email and role. Please sign up.")
    if user.auth_method == "google":
        raise HTTPException(403, detail="google_only")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Incorrect password")
    return _login_and_return_token(user)

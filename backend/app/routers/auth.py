#app/routers/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import SignUpRequest, LoginRequest, Token as TokenSchema
from app.crud.user import get_user_by_email, create_user, authenticate_user
from app.core.security import create_access_token, verify_password
from app.dependencies import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=TokenSchema)
def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = create_user(db, request.email, request.password, request.role)
    access_token = create_access_token(
        data={"user_id": new_user.id, "role": new_user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=TokenSchema)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=404, detail="No account is associated with that email. Please sign up.")
    access_token = create_access_token(
        data={"user_id": user.id, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

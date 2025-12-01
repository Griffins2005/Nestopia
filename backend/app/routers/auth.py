# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth import (
    SignUpRequest,
    LoginRequest,
    Token as TokenSchema,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    PasswordResetConfirm,
    PasswordResetConfirmResponse,
)
from app.crud import user as crud_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_password,
    generate_password_reset_token,
    decode_password_reset_token,
)
from app.dependencies import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _login_and_return_token(user):
    access_token = create_access_token(data={"user_id": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup", response_model=TokenSchema)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    if not data.role:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "role_required",
                "message": "Select renter or landlord before creating an account.",
            },
        )
    existing = crud_user.get_user_by_email_and_role(db, data.email, data.role)
    if existing:
        if existing.auth_method == "google":
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "google_only",
                    "message": "This email is already connected to Google sign-in. Use 'Continue with Google' instead.",
                },
            )
        raise HTTPException(
            status_code=400,
            detail={
                "code": "user_exists",
                "message": "An account already exists for this email and role. Try logging in.",
            },
        )
    try:
        user = crud_user.create_user(
            db, data.email, data.password, data.role, method="email"
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "password_too_long",
                "message": str(exc),
            },
        ) from exc
    return _login_and_return_token(user)

@router.post("/login", response_model=TokenSchema)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if not data.role:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "role_required",
                "message": "Select renter or landlord before continuing.",
            },
        )
    user = crud_user.get_user_by_email_and_role(db, data.email, data.role)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "user_not_found",
                "message": "No account is associated with that email for the selected role. Please sign up.",
            },
        )
    if user.auth_method == "google":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "google_only",
                "message": "This account was created via Google. Use 'Continue with Google' to sign in.",
            },
        )
    if not user.password_hash:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "password_not_set",
                "message": "This account does not have a password yet. Please use Google login or reset your password.",
            },
        )
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail={
                "code": "invalid_credentials",
                "message": "Email or password is incorrect.",
            },
        )
    return _login_and_return_token(user)


@router.post(
    "/password-reset/request",
    response_model=PasswordResetRequestResponse,
    summary="Start a password reset",
)
def request_password_reset(
    payload: PasswordResetRequest, db: Session = Depends(get_db)
):
    user = crud_user.get_user_by_email_and_role(db, payload.email, payload.role)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "user_not_found",
                "message": "No account exists for that email and role. Double-check the address or sign up.",
            },
        )
    if user.auth_method == "google":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "google_only",
                "message": "This login uses Google OAuth. Reset your password from your Google account instead.",
            },
        )
    reset_token = generate_password_reset_token(user.id, user.role)
    return PasswordResetRequestResponse(
        message=(
            f"We generated a reset token. Paste it into the confirmation form within "
            f"{settings.PASSWORD_RESET_TOKEN_MINUTES} minutes."
        ),
        reset_token=reset_token,
        expires_in_minutes=settings.PASSWORD_RESET_TOKEN_MINUTES,
    )


@router.post(
    "/password-reset/confirm",
    response_model=PasswordResetConfirmResponse,
    summary="Complete password reset",
)
def confirm_password_reset(
    payload: PasswordResetConfirm, db: Session = Depends(get_db)
):
    try:
        token_payload = decode_password_reset_token(payload.token)
    except ValueError as exc:
        if str(exc) == "expired":
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "expired_reset_token",
                    "message": "This reset link has expired. Request a new password reset.",
                },
            ) from exc
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_reset_token",
                "message": "The reset token is invalid. Request a new password reset.",
            },
        ) from exc

    user = crud_user.get_user_by_id(db, token_payload.user_id)
    if not user or user.role != token_payload.role:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_reset_token",
                "message": "The reset token does not match any account.",
            },
        )

    try:
        crud_user.set_user_password(db, user, payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "password_too_long",
                "message": str(exc),
            },
        ) from exc
    return PasswordResetConfirmResponse(
        message="Password updated successfully. You can now log in with your new password."
    )

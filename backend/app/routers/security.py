# app/routers/security.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.dependencies import get_db, get_current_user
from app.core.totp import (
    generate_totp_secret,
    provisioning_uri,
    verify_totp_code,
    qr_code_data_url,
)
from app.core.security import verify_password
from app.core.password_policy import validate_password_strength

router = APIRouter(prefix="/api/security", tags=["security"])


class TotpConfirmIn(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)


class TotpDisableIn(BaseModel):
    password: str
    code: str = Field(..., min_length=6, max_length=8)


@router.get("/status")
def security_status(current_user=Depends(get_current_user)):
    return {
        "auth_method": current_user.auth_method,
        "totp_enabled": bool(current_user.totp_enabled),
        "has_password": bool(current_user.password_hash),
    }


@router.post("/totp/setup")
def totp_setup(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.auth_method == "google" and not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Set a password first before enabling two-factor authentication.",
        )
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled.")

    secret = generate_totp_secret()
    current_user.totp_secret = secret
    current_user.totp_enabled = False
    db.commit()
    uri = provisioning_uri(secret, current_user.email)
    return {
        "secret": secret,
        "provisioning_uri": uri,
        "qr_code": qr_code_data_url(uri),
    }


@router.post("/totp/confirm")
def totp_confirm(
    payload: TotpConfirmIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Start setup before confirming.")
    if not verify_totp_code(current_user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code. Try again.")

    current_user.totp_enabled = True
    db.commit()
    return {"message": "Two-factor authentication is now on."}


@router.post("/totp/disable")
def totp_disable(
    payload: TotpDisableIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is not enabled.")
    if not current_user.password_hash or not verify_password(
        payload.password, current_user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if not verify_totp_code(current_user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    return {"message": "Two-factor authentication has been turned off."}

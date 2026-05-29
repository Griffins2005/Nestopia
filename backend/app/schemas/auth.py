# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field, root_validator
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    user_id: int
    role: str

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)
    role: str  # "renter" or "landlord"
    name: Optional[str] = Field(None, max_length=120)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


class Verify2FARequest(BaseModel):
    challenge_token: str
    code: str = Field(..., min_length=6, max_length=8)


class PasswordResetRequest(BaseModel):
    email: EmailStr
    role: str


class PasswordResetRequestResponse(BaseModel):
    message: str
    reset_token: str
    expires_in_minutes: int


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=256)
    confirm_password: str

    @root_validator
    def passwords_match(cls, values):
        new_password = values.get("new_password")
        confirm_password = values.get("confirm_password")
        if new_password != confirm_password:
            raise ValueError("Passwords do not match")
        return values


class PasswordResetConfirmResponse(BaseModel):
    message: str
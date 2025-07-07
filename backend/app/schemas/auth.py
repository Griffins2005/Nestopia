# app/schemas/auth.py
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    user_id: int
    role: str

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "renter" or "landlord"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

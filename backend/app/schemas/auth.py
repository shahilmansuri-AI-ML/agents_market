from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class SignupResponse(BaseModel):
    message: str
    email: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    is_verified: bool
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    role_id: Optional[str] = None
    role_name: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

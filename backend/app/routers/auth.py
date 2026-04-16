from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import (
    SignupRequest, SignupResponse, VerifyOTPRequest,
    LoginRequest, LoginResponse, RefreshTokenRequest, TokenResponse
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    result = AuthService.signup(db, request)
    return result


@router.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify email with OTP code."""
    result = AuthService.verify_otp(db, request.email, request.otp)
    return result


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive access tokens."""
    result = AuthService.login(db, request)
    return result


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    result = AuthService.refresh_access_token(request.refresh_token)
    return result


@router.post("/logout")
def logout():
    """Logout user (client should discard tokens)."""
    return {"message": "Logged out successfully"}

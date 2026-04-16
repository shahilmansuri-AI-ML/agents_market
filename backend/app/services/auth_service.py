from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from uuid import UUID

from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.hashing import hash_password_util, verify_password_util
from app.utils.jwt import create_access_token, create_refresh_token, verify_token
from app.utils.otp import generate_otp, store_otp, verify_otp
from app.utils.email import send_otp_email
import logging


class AuthService:
    
    @staticmethod
    def signup(db: Session, request: SignupRequest) -> dict:
        """Register a new user and send OTP."""
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            if existing_user.is_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            # Resend OTP for unverified user
            otp = generate_otp()
            store_otp(request.email, otp)
            logging.info(f"🔐 OTP for {request.email}: {otp}")
            
            # Send OTP email
            email_sent = send_otp_email(request.email, otp)
            if email_sent:
                logging.info(f"📧 OTP email sent to {request.email}")
                return {"message": "OTP sent to email", "email": request.email}
            else:
                logging.warning(f"⚠️ Failed to send OTP email to {request.email}")
                return {"message": "OTP generated but email failed", "email": request.email}
        
        # Create new user
        hashed_password = hash_password_util(request.password)
        new_user = User(
            email=request.email,
            password_hash=hashed_password,
            is_verified=False,
            status="active"
        )
        
        db.add(new_user)
        db.commit()
        
        # Generate and send OTP
        otp = generate_otp()
        store_otp(request.email, otp)
        logging.info(f"🔐 OTP for {request.email}: {otp}")
        
        # Send OTP email
        email_sent = send_otp_email(request.email, otp)
        if email_sent:
            logging.info(f"📧 OTP email sent to {request.email}")
            return {"message": "Signup successful. Please check your email.", "email": request.email}
        else:
            logging.warning(f"⚠️ Failed to send OTP email to {request.email}")
            return {"message": "Signup successful but email failed", "email": request.email}
    
    @staticmethod
    def verify_otp(db: Session, email: str, otp: str) -> dict:
        """Verify OTP and activate user account."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )
        
        if not verify_otp(email, otp):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Mark user as verified
        user.is_verified = True
        db.commit()
        
        # Generate tokens for automatic login after verification
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Get user's role from their first tenant (if any)
        tenant_user = db.query(TenantUser).filter(TenantUser.user_id == user.id).first()
        role_id = None
        role_name = None
        
        if tenant_user and tenant_user.role_id:
            role = db.query(Role).filter(Role.id == tenant_user.role_id).first()
            if role:
                role_id = str(role.id)
                role_name = role.name
        
        return {
            "message": "Email verified successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "is_verified": user.is_verified,
            "role_id": role_id,
            "role_name": role_name
        }
    
    @staticmethod
    def login(db: Session, request: LoginRequest) -> dict:
        """Authenticate user and return tokens."""
        from datetime import timezone
        
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user or not verify_password_util(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email first"
            )
        
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended"
            )
        
        # Update last login timestamp
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        # Generate tokens
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Get user's role and tenant from their first tenant (if any)
        tenant_user = db.query(TenantUser).filter(TenantUser.user_id == user.id).first()
        role_id = None
        role_name = None
        tenant_id = None
        tenant_name = None
        
        if tenant_user:
            tenant_id = str(tenant_user.tenant_id)
            # Get tenant name
            tenant = db.query(Tenant).filter(Tenant.id == tenant_user.tenant_id).first()
            if tenant:
                tenant_name = tenant.name
            
            if tenant_user.role_id:
                role = db.query(Role).filter(Role.id == tenant_user.role_id).first()
                if role:
                    role_id = str(role.id)
                    role_name = role.name
        
        # Debug logging
        logging.info(f"🔑 Login response for {user.email}: tenant_id={tenant_id}, tenant_name={tenant_name}, role_id={role_id}, role_name={role_name}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "is_verified": user.is_verified,
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
            "role_id": role_id,
            "role_name": role_name
        }
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        """Generate new access token from refresh token."""
        payload = verify_token(refresh_token, "refresh")
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        token_data = {"sub": payload["sub"], "email": payload["email"]}
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

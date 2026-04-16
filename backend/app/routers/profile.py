from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from uuid import UUID

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user, AuthContext
from app.models.user import User
from app.models.tenant import Tenant
from app.models.single_agent import SingleAgent
from app.models.api_key import APIKey
from app.models.api_usage_log import APIUsageLog
from app.models.user_session import UserSession
from app.models.tenant_user import TenantUser
from app.utils.hashing import verify_password_util, hash_password_util

router = APIRouter(prefix="/profile", tags=["Profile"])


# ========== SCHEMAS ==========

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    profile_picture_url: Optional[str] = None


class TenantUpdateRequest(BaseModel):
    company_size: Optional[str] = None
    website: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str]
    job_title: Optional[str]
    profile_picture_url: Optional[str]
    tenant_id: str
    tenant_name: str
    company_size: Optional[str]
    website: Optional[str]
    created_at: str
    last_login: Optional[str]


class AccountStatsResponse(BaseModel):
    agents_created: int
    total_executions: int
    api_calls_this_month: int
    storage_used_gb: float
    team_members: int
    api_keys_active: int
    member_since: str
    last_login: Optional[str]


class SessionInfo(BaseModel):
    session_id: str
    device_info: Optional[str]
    ip_address: Optional[str]
    last_active: str
    created_at: str


# ========== ENDPOINTS ==========

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    http_request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile information."""
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get tenant_id from header
    tenant_id_header = http_request.headers.get("X-Tenant-ID")
    if not tenant_id_header:
        # Fallback: get user's first active tenant
        tenant_user = db.query(TenantUser).filter(
            TenantUser.user_id == auth.user_id,
            TenantUser.status == "active"
        ).first()
        if not tenant_user:
            raise HTTPException(status_code=404, detail="No active tenant found")
        tenant_id = tenant_user.tenant_id
    else:
        tenant_id = UUID(tenant_id_header)
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return ProfileResponse(
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        job_title=user.job_title,
        profile_picture_url=user.profile_picture_url,
        tenant_id=str(tenant.id),
        tenant_name=tenant.name,
        company_size=tenant.company_size,
        website=tenant.website,
        created_at=user.created_at.isoformat() if user.created_at else "",
        last_login=user.last_login.isoformat() if user.last_login else None
    )


@router.put("/me")
def update_my_profile(
    http_request: Request,
    request: ProfileUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information."""
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.job_title is not None:
        user.job_title = request.job_title
    if request.profile_picture_url is not None:
        user.profile_picture_url = request.profile_picture_url
    
    db.commit()
    
    return {"message": "Profile updated successfully"}


@router.put("/tenant")
def update_tenant_profile(
    http_request: Request,
    request: TenantUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update tenant/company profile information."""
    # Get tenant_id from header
    tenant_id_header = http_request.headers.get("X-Tenant-ID")
    if not tenant_id_header:
        # Fallback: get user's first active tenant
        tenant_user = db.query(TenantUser).filter(
            TenantUser.user_id == auth.user_id,
            TenantUser.status == "active"
        ).first()
        if not tenant_user:
            raise HTTPException(status_code=404, detail="No active tenant found")
        tenant_id = tenant_user.tenant_id
    else:
        tenant_id = UUID(tenant_id_header)
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if request.company_size is not None:
        tenant.company_size = request.company_size
    if request.website is not None:
        tenant.website = request.website
    
    db.commit()
    
    return {"message": "Company profile updated successfully"}


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password (requires current password)."""
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password_util(request.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    user.password_hash = hash_password_util(request.new_password)
    user.last_password_change = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/stats", response_model=AccountStatsResponse)
def get_account_stats(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get account statistics for overview page."""
    from dateutil.relativedelta import relativedelta
    
    # Get tenant_id from header
    tenant_id_header = request.headers.get("X-Tenant-ID")
    if not tenant_id_header:
        # Fallback: get user's first active tenant
        tenant_user = db.query(TenantUser).filter(
            TenantUser.user_id == auth.user_id,
            TenantUser.status == "active"
        ).first()
        if not tenant_user:
            raise HTTPException(status_code=404, detail="No active tenant found")
        tenant_id = tenant_user.tenant_id
    else:
        tenant_id = UUID(tenant_id_header)
    
    # Calculate start of current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count agents created by this tenant
    agents_count = db.query(func.count(SingleAgent.id)).filter(
        SingleAgent.tenant_id == tenant_id
    ).scalar() or 0
    
    # Count total executions (placeholder - execution tracking not yet implemented)
    total_executions = 0  # TODO: Implement execution tracking
    
    # Count API calls this month (as provider)
    api_calls_month = db.query(func.count(APIUsageLog.id)).filter(
        APIUsageLog.provider_tenant_id == tenant_id,
        APIUsageLog.created_at >= month_start
    ).scalar() or 0
    
    # Storage used (placeholder - implement based on your storage logic)
    storage_used_gb = 0.0  # TODO: Calculate actual storage
    
    # Count team members (users in this tenant)
    team_members = db.query(func.count(TenantUser.user_id.distinct())).filter(
        TenantUser.tenant_id == tenant_id
    ).scalar() or 0
    
    # Count active API keys
    api_keys_active = db.query(func.count(APIKey.id)).filter(
        APIKey.tenant_id == tenant_id,
        APIKey.status == "active"
    ).scalar() or 0
    
    # Get user info
    user = db.query(User).filter(User.id == auth.user_id).first()
    
    return AccountStatsResponse(
        agents_created=agents_count,
        total_executions=total_executions,
        api_calls_this_month=api_calls_month,
        storage_used_gb=storage_used_gb,
        team_members=team_members,
        api_keys_active=api_keys_active,
        member_since=user.created_at.isoformat() if user and user.created_at else "",
        last_login=user.last_login.isoformat() if user and user.last_login else None
    )


@router.get("/sessions", response_model=list[SessionInfo])
def get_active_sessions(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user."""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == auth.user_id,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).order_by(UserSession.last_active.desc()).all()
    
    return [
        SessionInfo(
            session_id=str(session.id),
            device_info=session.device_info,
            ip_address=session.ip_address,
            last_active=session.last_active.isoformat() if session.last_active else "",
            created_at=session.created_at.isoformat() if session.created_at else ""
        )
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session."""
    session = db.query(UserSession).filter(
        UserSession.id == UUID(session_id),
        UserSession.user_id == auth.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session revoked successfully"}

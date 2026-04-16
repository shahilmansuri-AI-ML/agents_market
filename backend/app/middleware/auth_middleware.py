from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Union
from uuid import UUID
from datetime import datetime

from app.utils.jwt import verify_token
from app.database.session import get_db
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.permission import Permission
from app.models.api_key import APIKey
from app.utils.hashing import verify_api_key

security = HTTPBearer(auto_error=False)


class AuthContext:
    """Authentication context attached to request."""
    def __init__(self, user_id: UUID, email: str, is_super_admin: bool = False):
        self.user_id = user_id
        self.email = email
        self.is_super_admin = is_super_admin


class APIKeyContext:
    """API Key authentication context."""
    def __init__(self, api_key_id: UUID, tenant_id: UUID, allowed_agent_ids: list):
        self.api_key_id = api_key_id
        self.tenant_id = tenant_id
        self.allowed_agent_ids = allowed_agent_ids


class Identity:
    """Unified identity for JWT or API key authentication."""
    def __init__(self, auth_type: str, context: Union[AuthContext, APIKeyContext]):
        self.auth_type = auth_type  # "jwt" | "api_key"
        self.context = context


class TenantContext:
    """Tenant context attached to request."""
    def __init__(self, tenant_id: UUID, role_id: Optional[UUID] = None, permissions: list = None):
        self.tenant_id = tenant_id
        self.role_id = role_id
        self.permissions = permissions or []


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> AuthContext:
    """Extract and verify current user from JWT token."""
    token = credentials.credentials
    
    payload = verify_token(token, "access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    return AuthContext(
        user_id=user.id,
        email=user.email,
        is_super_admin=user.is_super_admin
    )


async def get_current_identity(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Identity:
    """
    Unified authentication: supports both JWT (Authorization: Bearer) and API Key (X-API-Key).
    Returns Identity object with auth_type and context.
    """
    
    # Check for X-API-Key header first
    api_key_header = request.headers.get("X-API-Key")
    
    if api_key_header:
        # API Key authentication
        return await _authenticate_api_key(api_key_header, db)
    
    # Fall back to JWT authentication
    if credentials:
        token = credentials.credentials
        payload = verify_token(token, "access")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not active"
            )
        
        auth_context = AuthContext(
            user_id=user.id,
            email=user.email,
            is_super_admin=user.is_super_admin
        )
        return Identity(auth_type="jwt", context=auth_context)
    
    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: provide either Authorization header or X-API-Key"
    )


async def _authenticate_api_key(api_key: str, db: Session) -> Identity:
    """Authenticate using API key and return Identity."""
    
    # Extract prefix
    if "." not in api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format"
        )
    
    prefix = api_key.split(".")[0]
    
    # Find API key by prefix
    key_record = db.query(APIKey).filter(
        APIKey.prefix == prefix,
        APIKey.status == "active"
    ).first()
    
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Verify key hash
    if not verify_api_key(api_key, key_record.key_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Check expiration
    if key_record.expires_at and key_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired"
        )
    
    # Update last used timestamp
    key_record.last_used_at = datetime.utcnow()
    db.commit()
    
    # Return API key context
    api_key_context = APIKeyContext(
        api_key_id=key_record.id,
        tenant_id=key_record.tenant_id,
        allowed_agent_ids=key_record.allowed_agent_ids or []
    )
    
    return Identity(auth_type="api_key", context=api_key_context)


async def get_current_tenant(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_id: Optional[str] = None
) -> TenantContext:
    """Extract tenant context for current user."""
    
    # If tenant_id is provided (from path or query), use it
    if tenant_id:
        tenant_uuid = UUID(tenant_id)
    else:
        # Check for X-Tenant-ID header (used by frontend for tenant selection)
        header_tenant_id = request.headers.get("X-Tenant-ID")
        if header_tenant_id:
            try:
                tenant_uuid = UUID(header_tenant_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid tenant ID in header"
                )
        else:
            # Get user's first active tenant as fallback
            tenant_user = db.query(TenantUser).filter(
                TenantUser.user_id == auth.user_id,
                TenantUser.status == "active"
            ).first()
            
            if not tenant_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active tenant found for user"
                )
            
            tenant_uuid = tenant_user.tenant_id
    
    # Verify user has access to this tenant
    tenant_user = db.query(TenantUser).filter(
        TenantUser.tenant_id == tenant_uuid,
        TenantUser.user_id == auth.user_id,
        TenantUser.status == "active"
    ).first()
    
    if not tenant_user and not auth.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant"
        )
    
    # Get user permissions for this tenant
    permissions = []
    if tenant_user and tenant_user.role_id:
        role_permissions = db.query(Permission).join(
            RolePermission, RolePermission.permission_id == Permission.id
        ).filter(
            RolePermission.role_id == tenant_user.role_id
        ).all()
        
        permissions = [p.name for p in role_permissions]
    
    return TenantContext(
        tenant_id=tenant_uuid,
        role_id=tenant_user.role_id if tenant_user else None,
        permissions=permissions
    )


def require_permission(permission_name: str):
    """Dependency to check if user has specific permission."""
    async def permission_checker(
        auth: AuthContext = Depends(get_current_user),
        tenant: TenantContext = Depends(get_current_tenant),
        db: Session = Depends(get_db)
    ):
        # Super admins have all permissions
        if auth.is_super_admin:
            return auth
        
        # Check if user has the required permission
        if permission_name not in tenant.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_name} required"
            )
        
        return auth
    
    return permission_checker


def require_super_admin():
    """Dependency to check if user is super admin."""
    async def super_admin_checker(
        auth: AuthContext = Depends(get_current_user)
    ):
        if not auth.is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin access required"
            )
        return auth
    
    return super_admin_checker

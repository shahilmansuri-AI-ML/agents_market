from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import uuid
import secrets
import string

from app.database.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.models.permission import Permission
from app.utils.jwt import create_access_token, create_refresh_token
from app.utils.hashing import verify_password_util, hash_password
from app.middleware.auth_middleware import get_current_user, AuthContext

router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

class SuperAdminLoginRequest(BaseModel):
    email: str
    password: str

class SuperAdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: str
    email: str
    is_super_admin: bool

class TenantCreateRequest(BaseModel):
    name: str
    description: str = None
    domain: str = None
    owner_email: str
    owner_password: str

class TenantUpdateRequest(BaseModel):
    name: str = None
    description: str = None
    domain: str = None
    status: str = None

class TenantCreateResponse(BaseModel):
    tenant: dict
    owner_credentials: dict
    message: str

@router.post("/login", response_model=SuperAdminLoginResponse)
def super_admin_login(request: SuperAdminLoginRequest, db: Session = Depends(get_db)):
    """Super admin login endpoint."""
    
    # Check if user exists and is super admin
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid super admin credentials"
        )
    
    # Verify password (for now, we'll use the bypass logic)
    SUPER_ADMIN_EMAIL = "admin@media2ai.com"
    SUPER_ADMIN_PASSWORD = "superpassword123"
    
    if request.email != SUPER_ADMIN_EMAIL or request.password != SUPER_ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid super admin credentials"
        )
    
    # Verify user is active
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin account is suspended"
        )
    
    # Generate tokens
    token_data = {"sub": str(user.id), "email": user.email, "is_super_admin": True}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
        "is_super_admin": True
    }

@router.get("/tenants")
def get_all_tenants(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tenants (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    tenants = db.query(Tenant).all()
    
    result = []
    for tenant in tenants:
        tenant_dict = {
            "id": tenant.id,
            "name": tenant.name,
            "description": tenant.description,
            "domain": tenant.domain,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "updated_at": tenant.updated_at
        }
        result.append(tenant_dict)
    
    return result

@router.get("/users")
def get_all_users(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users across all tenants (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    users = db.query(User).all()
    
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "email": user.email,
            "is_verified": user.is_verified,
            "is_super_admin": user.is_super_admin,
            "status": user.status,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        result.append(user_dict)
    
    return result

@router.get("/roles")
def get_all_roles(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all roles across all tenants (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    roles = db.query(Role).all()
    
    result = []
    for role in roles:
        role_dict = {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "tenant_id": role.tenant_id,
            "created_at": role.created_at,
            "updated_at": role.updated_at
        }
        result.append(role_dict)
    
    return result

@router.get("/permissions")
def get_all_permissions(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all permissions (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    permissions = db.query(Permission).all()
    
    result = []
    for permission in permissions:
        permission_dict = {
            "id": permission.id,
            "name": permission.name,
            "description": permission.description,
            "resource": permission.resource,
            "action": permission.action
        }
        result.append(permission_dict)
    
    return result

@router.post("/tenants", response_model=TenantCreateResponse)
def create_tenant(
    request: TenantCreateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tenant with owner (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    # Check if tenant name already exists
    existing_tenant = db.query(Tenant).filter(Tenant.name == request.name).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant with this name already exists"
        )
    
    # Check if owner email already exists
    existing_user = db.query(User).filter(User.email == request.owner_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    try:
        # Create owner user first
        owner_user = User(
            email=request.owner_email,
            password_hash=hash_password(request.owner_password),
            is_verified=True,
            is_super_admin=False,
            status="active"
        )
        db.add(owner_user)
        db.flush()  # Get the user ID
        
        # Use TenantService to create tenant with all default roles
        from app.services.tenant_service import TenantService
        from app.schemas.tenant import TenantCreate
        
        tenant_create = TenantCreate(
            name=request.name,
            description=request.description,
            domain=request.domain
        )
        
        tenant = TenantService.create_tenant(db, owner_user.id, tenant_create)
        
        # Log creation in terminal
        print(f"\n🏢 NEW TENANT CREATED:")
        print(f"   📋 Tenant Name: {tenant.name}")
        print(f"   🆔 Tenant ID: {tenant.id}")
        print(f"   👤 Owner Email: {owner_user.email}")
        print(f"   🔑 Owner Password: {request.owner_password}")
        print(f"   📅 Created: {tenant.created_at}")
        print(f"   " + "="*50)
        
        return {
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "description": tenant.description,
                "domain": tenant.domain,
                "status": tenant.status,
                "created_at": tenant.created_at
            },
            "owner_credentials": {
                "email": owner_user.email,
                "password": request.owner_password
            },
            "message": f"Tenant '{tenant.name}' created successfully with owner {owner_user.email}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tenant: {str(e)}"
        )

@router.put("/tenants/{tenant_id}")
def update_tenant(
    tenant_id: str,
    request: TenantUpdateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a tenant (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    # Find tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    try:
        # Update fields
        if request.name is not None:
            tenant.name = request.name
        if request.description is not None:
            tenant.description = request.description
        if request.domain is not None:
            tenant.domain = request.domain
        if request.status is not None:
            tenant.status = request.status
        
        db.commit()
        
        print(f"\n🏢 TENANT UPDATED:")
        print(f"   📋 Tenant Name: {tenant.name}")
        print(f"   🆔 Tenant ID: {tenant.id}")
        print(f"   📊 Status: {tenant.status}")
        print(f"   📅 Updated: {tenant.updated_at}")
        print(f"   " + "="*50)
        
        return {
            "id": tenant.id,
            "name": tenant.name,
            "description": tenant.description,
            "domain": tenant.domain,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "updated_at": tenant.updated_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update tenant: {str(e)}"
        )

@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a tenant (super admin only)."""
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    # Find tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    try:
        # Store tenant info for logging
        tenant_name = tenant.name
        
        # Delete related records (cascade should handle this, but let's be explicit)
        # Delete tenant users
        db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).delete()
        
        # Delete tenant roles
        db.query(Role).filter(Role.tenant_id == tenant_id).delete()
        
        # Delete tenant
        db.delete(tenant)
        db.commit()
        
        print(f"\n🏢 TENANT DELETED:")
        print(f"   📋 Tenant Name: {tenant_name}")
        print(f"   🆔 Tenant ID: {tenant_id}")
        print(f"   📅 Deleted: {tenant.updated_at}")
        print(f"   " + "="*50)
        
        return {"message": f"Tenant '{tenant_name}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tenant: {str(e)}"
        )

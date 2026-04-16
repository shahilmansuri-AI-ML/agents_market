from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.schemas.tenant import TenantResponse, TenantCreate
from app.schemas.user import UserResponse
from app.services.tenant_service import TenantService
from app.middleware.auth_middleware import get_current_user, AuthContext, require_super_admin
from app.utils.hashing import hash_password_util

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/tenants", response_model=List[TenantResponse])
def list_all_tenants(
    auth: AuthContext = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """List all tenants (super admin only)."""
    return db.query(Tenant).all()


@router.post("/tenants", response_model=TenantResponse)
def create_tenant_as_admin(
    request: TenantCreate,
    auth: AuthContext = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Create tenant as super admin."""
    return TenantService.create_tenant(db, auth.user_id, request)


@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    auth: AuthContext = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Delete a tenant (super admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == UUID(tenant_id)).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    db.delete(tenant)
    db.commit()
    
    return {"message": "Tenant deleted successfully"}


@router.post("/tenants/{tenant_id}/create-admin")
def create_tenant_admin(
    tenant_id: str,
    email: str,
    password: str,
    auth: AuthContext = Depends(require_super_admin()),
    db: Session = Depends(get_db)
):
    """Create an admin user for a tenant (super admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == UUID(tenant_id)).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user
        hashed_password = hash_password_util(password)
        user = User(
            email=email,
            password_hash=hashed_password,
            is_verified=True,
            status="active"
        )
        db.add(user)
        db.flush()
    
    # Get owner role for tenant
    owner_role = db.query(Role).filter(
        Role.tenant_id == UUID(tenant_id),
        Role.name == "Owner"
    ).first()
    
    if not owner_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner role not found for tenant"
        )
    
    # Add user to tenant as owner
    tenant_user = TenantUser(
        tenant_id=UUID(tenant_id),
        user_id=user.id,
        role_id=owner_role.id,
        status="active"
    )
    db.add(tenant_user)
    db.commit()
    
    return {"message": "Admin user created successfully", "user_id": str(user.id)}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse, TenantWithRole
from app.services.tenant_service import TenantService
from app.services.audit_service import AuditService
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("", response_model=TenantResponse)
def create_tenant(
    request: TenantCreate,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tenant (user becomes owner)."""
    tenant = TenantService.create_tenant(db, auth.user_id, request)
    
    # Log tenant creation
    AuditService.log(
        db=db,
        tenant_id=tenant.id,
        actor_id=auth.user_id,
        action="tenant_created",
        resource="tenant",
        resource_id=tenant.id,
        meta_data={"tenant_name": tenant.name}
    )
    
    return tenant


@router.get("/current", response_model=TenantResponse)
def get_current_tenant_info(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant information."""
    return TenantService.get_tenant(db, tenant.tenant_id)


@router.get("/my-tenants")
def get_my_tenants(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tenants for current user."""
    return TenantService.get_user_tenants(db, auth.user_id)


@router.get("/all-tenants")
def get_all_tenants(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tenants (super admin only)."""
    from app.models.user import User
    
    # Check if user is super admin
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user or not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    return TenantService.get_all_tenants(db)


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tenant by ID."""
    from uuid import UUID
    try:
        return TenantService.get_tenant(db, UUID(tenant_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant ID format"
        )


@router.patch("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: str,
    request: TenantUpdate,
    auth: AuthContext = Depends(require_permission("tenant.manage")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update tenant information."""
    from uuid import UUID
    updated_tenant = TenantService.update_tenant(db, UUID(tenant_id), request)
    
    # Log tenant update
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="tenant_updated",
        resource="tenant",
        resource_id=updated_tenant.id,
        meta_data={"changes": request.dict(exclude_unset=True)}
    )
    
    return updated_tenant

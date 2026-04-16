from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.schemas.user import UserResponse, UserWithRole, UserUpdate, UserRoleUpdate
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserWithRole])
def list_tenant_users(
    auth: AuthContext = Depends(require_permission("users.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all users in current tenant."""
    tenant_users = db.query(TenantUser).filter(
        TenantUser.tenant_id == tenant.tenant_id
    ).all()
    
    result = []
    for tu in tenant_users:
        user = db.query(User).filter(User.id == tu.user_id).first()
        role = db.query(Role).filter(Role.id == tu.role_id).first() if tu.role_id else None
        
        if user:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "is_verified": user.is_verified,
                "is_super_admin": user.is_super_admin,
                "status": user.status,
                "created_at": user.created_at,
                "role_id": str(tu.role_id) if tu.role_id else None,
                "role_name": role.name if role else None,
                "tenant_status": tu.status
            }
            result.append(user_dict)
    
    return result


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    request: UserRoleUpdate,
    auth: AuthContext = Depends(require_permission("roles.assign")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update user's role in tenant."""
    tenant_user = db.query(TenantUser).filter(
        TenantUser.tenant_id == tenant.tenant_id,
        TenantUser.user_id == UUID(user_id)
    ).first()
    
    if not tenant_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in tenant"
        )
    
    # Verify role belongs to tenant
    role = db.query(Role).filter(
        Role.id == request.role_id,
        Role.tenant_id == tenant.tenant_id
    ).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    tenant_user.role_id = request.role_id
    db.commit()
    
    # Log role change
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="role_changed",
        resource="user",
        resource_id=UUID(user_id),
        meta_data={"new_role": role.name}
    )
    
    return {"message": "User role updated successfully"}


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    status: str,
    auth: AuthContext = Depends(require_permission("users.update")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update user's status in tenant."""
    tenant_user = db.query(TenantUser).filter(
        TenantUser.tenant_id == tenant.tenant_id,
        TenantUser.user_id == UUID(user_id)
    ).first()
    
    if not tenant_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in tenant"
        )
    
    if status not in ["active", "suspended"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    tenant_user.status = status
    db.commit()
    
    # Log status change
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="user_status_changed",
        resource="user",
        resource_id=UUID(user_id),
        meta_data={"new_status": status}
    )
    
    return {"message": "User status updated successfully"}


@router.delete("/{user_id}")
def remove_user_from_tenant(
    user_id: str,
    auth: AuthContext = Depends(require_permission("users.delete")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Remove user from tenant."""
    tenant_user = db.query(TenantUser).filter(
        TenantUser.tenant_id == tenant.tenant_id,
        TenantUser.user_id == UUID(user_id)
    ).first()
    
    if not tenant_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in tenant"
        )
    
    db.delete(tenant_user)
    db.commit()
    
    # Log user removal
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="user_removed",
        resource="user",
        resource_id=UUID(user_id)
    )
    
    return {"message": "User removed from tenant"}

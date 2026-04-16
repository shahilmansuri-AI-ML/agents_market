from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.schemas.role import RoleCreate, RoleResponse, RoleWithPermissions, PermissionResponse, AssignRoleRequest
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("", response_model=RoleResponse)
def create_role(
    request: RoleCreate,
    auth: AuthContext = Depends(require_permission("roles.manage")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new role in tenant."""
    # Check if role name already exists in tenant
    existing = db.query(Role).filter(
        Role.tenant_id == tenant.tenant_id,
        Role.name == request.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists in this tenant"
        )
    
    # Create role
    role = Role(
        tenant_id=tenant.tenant_id,
        name=request.name,
        description=request.description,
        is_system=False
    )
    db.add(role)
    db.flush()
    
    # Assign permissions
    for perm_id in request.permission_ids:
        role_perm = RolePermission(
            role_id=role.id,
            permission_id=perm_id
        )
        db.add(role_perm)
    
    db.commit()
    db.refresh(role)
    
    return role


@router.get("", response_model=List[RoleWithPermissions])
def list_roles(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all roles in tenant."""
    roles = db.query(Role).filter(Role.tenant_id == tenant.tenant_id).all()
    
    result = []
    for role in roles:
        permissions = db.query(Permission).join(
            RolePermission, RolePermission.permission_id == Permission.id
        ).filter(RolePermission.role_id == role.id).all()
        
        role_dict = {
            "id": str(role.id),
            "tenant_id": str(role.tenant_id),
            "name": role.name,
            "description": role.description,
            "is_system": role.is_system,
            "created_at": role.created_at.isoformat() if role.created_at else None,
            "permissions": [p.name for p in permissions]
        }
        result.append(role_dict)
    
    return result


@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    """List all available permissions."""
    return db.query(Permission).all()


@router.patch("/{role_id}/permissions")
def update_role_permissions(
    role_id: UUID,
    request: dict,
    auth: AuthContext = Depends(require_permission("roles.manage")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update permissions for a role (including system roles)."""
    # Get role and verify it belongs to tenant
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.tenant_id == tenant.tenant_id
    ).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Get permission_ids from request - can be sent as array directly or in a dict
    if isinstance(request, list):
        permission_ids = request
    elif isinstance(request, dict) and "permission_ids" in request:
        permission_ids = request["permission_ids"]
    else:
        permission_ids = request
    
    # Remove existing permissions
    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    
    # Add new permissions
    for perm_id in permission_ids:
        role_perm = RolePermission(
            role_id=role_id,
            permission_id=UUID(str(perm_id))
        )
        db.add(role_perm)
    
    db.commit()
    
    return {"message": "Role permissions updated successfully"}


@router.delete("/{role_id}")
def delete_role(
    role_id: UUID,
    auth: AuthContext = Depends(require_permission("roles.manage")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Delete a role (cannot delete system roles)."""
    role = db.query(Role).filter(
        Role.id == role_id,
        Role.tenant_id == tenant.tenant_id
    ).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system roles"
        )
    
    # Delete role permissions first
    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
    
    # Delete role
    db.delete(role)
    db.commit()
    
    return {"message": "Role deleted successfully"}

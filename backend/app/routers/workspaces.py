from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

from app.database.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.middleware.auth_middleware import get_current_user, AuthContext

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    size: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    size: Optional[str]
    created_at: str
    user_role: Optional[str] = None
    user_role_id: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    workspace_data: WorkspaceCreate,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new workspace (tenant) for the current user."""
    from app.services.tenant_service import TenantService
    from app.schemas.tenant import TenantCreate
    from uuid import UUID
    
    # Use the authenticated user
    user_id = auth.user_id
    
    try:
        # Create tenant/workspace using existing TenantService
        tenant_create = TenantCreate(
            name=workspace_data.name,
            description=workspace_data.description
        )
        
        tenant = TenantService.create_tenant(
            db=db,
            user_id=user_id,
            request=tenant_create
        )
        
        # Get the user's role in the newly created tenant
        from app.models.tenant_user import TenantUser
        from app.models.role import Role
        
        tenant_user = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant.id,
            TenantUser.user_id == user_id
        ).first()
        
        user_role = None
        user_role_id = None
        if tenant_user:
            role = db.query(Role).filter(Role.id == tenant_user.role_id).first()
            if role:
                user_role = role.name
                user_role_id = str(role.id)
        
        return WorkspaceResponse(
            id=tenant.id,
            name=tenant.name,
            description=tenant.description,
            size=workspace_data.size,
            created_at=tenant.created_at.isoformat(),
            user_role=user_role,
            user_role_id=user_role_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=List[WorkspaceResponse])
def get_user_workspaces(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all workspaces for the current user."""
    # Get tenants where user is a member
    from app.models.tenant_user import TenantUser
    tenant_users = db.query(TenantUser).filter(
        TenantUser.user_id == auth.user_id,
        TenantUser.status == "active"
    ).all()
    
    workspaces = []
    for tenant_user in tenant_users:
        workspaces.append(WorkspaceResponse(
            id=tenant_user.tenant.id,
            name=tenant_user.tenant.name,
            description=tenant_user.tenant.description,
            size=None,  # You might want to store this in tenant table
            created_at=tenant_user.tenant.created_at.isoformat()
        ))
    
    return workspaces

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific workspace."""
    # Get current user (placeholder)
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    
    # Check if user has access to this workspace
    from app.models.tenant_member import TenantMember
    member = db.query(TenantMember).filter(
        TenantMember.tenant_id == workspace_id,
        TenantMember.user_id == user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or access denied"
        )
    
    return WorkspaceResponse(
        id=member.tenant.id,
        name=member.tenant.name,
        description=member.tenant.description,
        size=None,
        created_at=member.tenant.created_at.isoformat()
    )

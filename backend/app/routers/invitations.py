from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.invitation import InvitationCreate, InvitationResponse, InvitationAccept
from app.services.invitation_service import InvitationService
from app.services.audit_service import AuditService
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.post("", response_model=InvitationResponse)
def create_invitation(
    request: InvitationCreate,
    auth: AuthContext = Depends(require_permission("invitations.send")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Send an invitation to join tenant."""
    invitation = InvitationService.create_invitation(
        db, tenant.tenant_id, auth.user_id, request
    )
    
    # Log invitation
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="invitation_sent",
        resource="invitation",
        resource_id=invitation.id,
        meta_data={"email": invitation.email}
    )
    
    return invitation


@router.get("", response_model=List[InvitationResponse])
def list_invitations(
    auth: AuthContext = Depends(require_permission("invitations.manage")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all invitations for tenant."""
    return InvitationService.get_tenant_invitations(db, tenant.tenant_id)


@router.get("/verify/{token}")
def verify_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify an invitation token (public endpoint)."""
    from app.models.invitation import Invitation
    from app.models.tenant import Tenant
    from app.models.role import Role
    from datetime import datetime
    
    invitation = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending"
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or already used"
        )
    
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Get tenant and role info
    tenant = db.query(Tenant).filter(Tenant.id == invitation.tenant_id).first()
    role = db.query(Role).filter(Role.id == invitation.role_id).first()
    
    return {
        "email": invitation.email,
        "tenant_id": str(invitation.tenant_id),
        "tenant_name": tenant.name,
        "role_name": role.name,
        "expires_at": invitation.expires_at
    }


@router.post("/accept")
def accept_invitation(
    request: InvitationAccept,
    db: Session = Depends(get_db)
):
    """Accept an invitation (public endpoint)."""
    result = InvitationService.accept_invitation(db, request.token, request.password)
    return result

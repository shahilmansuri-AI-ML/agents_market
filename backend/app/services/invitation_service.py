from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from uuid import UUID
import secrets

from app.models.invitation import Invitation
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.tenant import Tenant
from app.models.role import Role
from app.schemas.invitation import InvitationCreate
from app.utils.email import send_invitation_email
from app.utils.hashing import hash_password_util


class InvitationService:
    
    @staticmethod
    def create_invitation(
        db: Session,
        tenant_id: UUID,
        creator_id: UUID,
        request: InvitationCreate
    ) -> Invitation:
        """Create and send an invitation."""
        # Check if user is already a member
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            existing_membership = db.query(TenantUser).filter(
                TenantUser.tenant_id == tenant_id,
                TenantUser.user_id == existing_user.id
            ).first()
            if existing_membership:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this tenant"
                )
        
        # Check if there's a pending invitation
        pending_invitation = db.query(Invitation).filter(
            Invitation.tenant_id == tenant_id,
            Invitation.email == request.email,
            Invitation.status == "pending"
        ).first()
        if pending_invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation already sent to this email"
            )
        
        # Verify role exists and belongs to tenant
        role = db.query(Role).filter(
            Role.id == request.role_id,
            Role.tenant_id == tenant_id
        ).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Create invitation
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        invitation = Invitation(
            tenant_id=tenant_id,
            email=request.email,
            role_id=request.role_id,
            token=token,
            status="pending",
            expires_at=expires_at,
            created_by=creator_id
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        # Send invitation email
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        invitation_link = f"http://localhost:3000/accept-invitation?token={token}"
        send_invitation_email(request.email, tenant.name, invitation_link)
        
        # Log invitation token to backend terminal
        print("\n" + "="*60)
        print("📧 NEW INVITATION CREATED:")
        print(f"   🏢 Tenant: {tenant.name}")
        print(f"   📧 Email: {request.email}")
        print(f"   👤 Role: {role.name}")
        print(f"   🔑 Token: {token}")
        print(f"   🔗 Link: {invitation_link}")
        print(f"   📅 Expires: {expires_at}")
        print("="*60 + "\n")
        
        return invitation
    
    @staticmethod
    def accept_invitation(db: Session, token: str, password: str) -> dict:
        """Accept an invitation and create user account."""
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
            invitation.status = "expired"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired"
            )
        
        # Check if user already exists
        user = db.query(User).filter(User.email == invitation.email).first()
        
        if not user:
            # Create new user
            hashed_password = hash_password_util(password)
            user = User(
                email=invitation.email,
                password_hash=hashed_password,
                is_verified=True,  # Auto-verify invited users
                status="active"
            )
            db.add(user)
            db.flush()
        
        # Add user to tenant
        tenant_user = TenantUser(
            tenant_id=invitation.tenant_id,
            user_id=user.id,
            role_id=invitation.role_id,
            status="active"
        )
        db.add(tenant_user)
        
        # Mark invitation as accepted
        invitation.status = "accepted"
        
        db.commit()
        
        return {"message": "Invitation accepted successfully"}
    
    @staticmethod
    def get_tenant_invitations(db: Session, tenant_id: UUID):
        """Get all invitations for a tenant."""
        return db.query(Invitation).filter(
            Invitation.tenant_id == tenant_id
        ).order_by(Invitation.created_at.desc()).all()

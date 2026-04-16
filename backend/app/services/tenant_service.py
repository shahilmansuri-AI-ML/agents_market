from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID

from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.schemas.tenant import TenantCreate, TenantUpdate


class TenantService:
    
    @staticmethod
    def create_tenant(db: Session, user_id: UUID, request: TenantCreate) -> Tenant:
        """Create a new tenant and assign user as owner."""
        # Check if domain is already taken
        if request.domain:
            existing = db.query(Tenant).filter(Tenant.domain == request.domain).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Domain already taken"
                )
        
        # Create tenant
        tenant = Tenant(
            name=request.name,
            description=request.description,
            domain=request.domain if request.domain else None,
            status="active"
        )
        db.add(tenant)
        db.flush()
        
        # Create default owner role for this tenant
        owner_role = Role(
            tenant_id=tenant.id,
            name="Owner",
            description="Tenant owner with full permissions",
            is_system=True
        )
        db.add(owner_role)
        db.flush()
        
        # Assign all permissions to owner role
        permissions = db.query(Permission).all()
        for permission in permissions:
            role_perm = RolePermission(
                role_id=owner_role.id,
                permission_id=permission.id
            )
            db.add(role_perm)
        
        # Create default member role
        member_role = Role(
            tenant_id=tenant.id,
            name="Member",
            description="Basic tenant member",
            is_system=True
        )
        db.add(member_role)
        db.flush()
        
        # Assign basic permissions to member role
        basic_permissions = db.query(Permission).filter(
            Permission.name.in_(['agents.read', 'agents.create', 'workflow.execute'])
        ).all()
        for permission in basic_permissions:
            role_perm = RolePermission(
                role_id=member_role.id,
                permission_id=permission.id
            )
            db.add(role_perm)
        
        # Create AI Developer role
        ai_developer_role = Role(
            tenant_id=tenant.id,
            name="AI Developer",
            description="AI agent developer with advanced agent permissions",
            is_system=True
        )
        db.add(ai_developer_role)
        db.flush()
        
        # Assign AI Developer permissions
        ai_dev_permissions = db.query(Permission).filter(
            Permission.name.in_([
                'agents.read', 'agents.create', 'agents.update', 'agents.delete',
                'workflow.create', 'workflow.execute', 'workflow.delete',
                'tools.manage'
            ])
        ).all()
        for permission in ai_dev_permissions:
            role_perm = RolePermission(
                role_id=ai_developer_role.id,
                permission_id=permission.id
            )
            db.add(role_perm)
        
        # Create AI Ops role
        ai_ops_role = Role(
            tenant_id=tenant.id,
            name="AI Ops",
            description="AI operations specialist with monitoring and execution permissions",
            is_system=True
        )
        db.add(ai_ops_role)
        db.flush()
        
        # Assign AI Ops permissions
        ai_ops_permissions = db.query(Permission).filter(
            Permission.name.in_([
                'agents.read', 'agents.update', 'workflow.execute', 'audit.view',
                'api_keys.create', 'api_keys.delete'
            ])
        ).all()
        for permission in ai_ops_permissions:
            role_perm = RolePermission(
                role_id=ai_ops_role.id,
                permission_id=permission.id
            )
            db.add(role_perm)
        
        # Create Admin role
        admin_role = Role(
            tenant_id=tenant.id,
            name="Admin",
            description="Tenant administrator with user and role management permissions",
            is_system=True
        )
        db.add(admin_role)
        db.flush()
        
        # Assign Admin permissions (all except tenant.manage which is owner-only)
        admin_permissions = db.query(Permission).filter(
            Permission.name.in_([
                'users.create', 'users.read', 'users.update', 'users.delete',
                'roles.assign', 'roles.manage', 'audit.view',
                'api_keys.create', 'api_keys.delete',
                'agents.create', 'agents.read', 'agents.update', 'agents.delete',
                'tools.manage', 'workflow.create', 'workflow.execute', 'workflow.delete',
                'invitations.send', 'invitations.manage'
            ])
        ).all()
        for permission in admin_permissions:
            role_perm = RolePermission(
                role_id=admin_role.id,
                permission_id=permission.id
            )
            db.add(role_perm)
        
        # Add user as owner
        tenant_user = TenantUser(
            tenant_id=tenant.id,
            user_id=user_id,
            role_id=owner_role.id,
            status="active"
        )
        db.add(tenant_user)
        
        db.commit()
        db.refresh(tenant)
        
        return tenant
    
    @staticmethod
    def get_tenant(db: Session, tenant_id: UUID) -> Tenant:
        """Get tenant by ID."""
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        return tenant
    
    @staticmethod
    def update_tenant(db: Session, tenant_id: UUID, request: TenantUpdate) -> Tenant:
        """Update tenant information."""
        tenant = TenantService.get_tenant(db, tenant_id)
        
        if request.name is not None:
            tenant.name = request.name
        if request.description is not None:
            tenant.description = request.description
        if request.domain is not None:
            # Check if new domain is available
            existing = db.query(Tenant).filter(
                Tenant.domain == request.domain,
                Tenant.id != tenant_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Domain already taken"
                )
            tenant.domain = request.domain
        if request.status is not None:
            tenant.status = request.status
        
        db.commit()
        db.refresh(tenant)
        
        return tenant
    
    @staticmethod
    def get_user_tenants(db: Session, user_id: UUID):
        """Get all tenants for a user."""
        tenant_users = db.query(TenantUser).filter(
            TenantUser.user_id == user_id,
            TenantUser.status == "active"
        ).all()
        
        tenants = []
        for tu in tenant_users:
            tenant = db.query(Tenant).filter(Tenant.id == tu.tenant_id).first()
            if tenant:
                role = db.query(Role).filter(Role.id == tu.role_id).first()
                tenant_dict = {
                    "id": tenant.id,
                    "name": tenant.name,
                    "description": tenant.description,
                    "domain": tenant.domain,
                    "status": tenant.status,
                    "created_at": tenant.created_at,
                    "user_role": role.name if role else None,
                    "user_role_id": str(role.id) if role else None,
                    "user_status": tu.status
                }
                tenants.append(tenant_dict)
        
        return tenants
    
    @staticmethod
    def get_all_tenants(db: Session):
        """Get all tenants (super admin only)."""
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

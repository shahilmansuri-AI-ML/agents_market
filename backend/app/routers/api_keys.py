from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.schemas.api_key import APIKeyCreate, APIKeyResponse, APIKeyCreateResponse
from app.services.api_key_service import APIKeyService
from app.services.audit_service import AuditService
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.post("", response_model=APIKeyCreateResponse)
def create_api_key(
    request: APIKeyCreate,
    auth: AuthContext = Depends(require_permission("api_keys.create")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new API key."""
    result = APIKeyService.create_api_key(
        db, tenant.tenant_id, auth.user_id, request
    )
    
    # Log API key creation
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="api_key_created",
        resource="api_key",
        resource_id=result["key_info"].id,
        meta_data={"name": request.name}
    )
    
    return result


@router.get("", response_model=List[APIKeyResponse])
def list_api_keys(
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all API keys for tenant."""
    return APIKeyService.get_tenant_api_keys(db, tenant.tenant_id)


@router.delete("/{api_key_id}")
def revoke_api_key(
    api_key_id: str,
    auth: AuthContext = Depends(require_permission("api_keys.delete")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Revoke an API key."""
    result = APIKeyService.revoke_api_key(db, UUID(api_key_id), tenant.tenant_id)
    
    # Log API key revocation
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="api_key_revoked",
        resource="api_key",
        resource_id=UUID(api_key_id)
    )
    
    return result

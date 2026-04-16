from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import AuditService
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext, require_permission

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/logs")
def get_audit_logs(
    action: Optional[str] = None,
    resource: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    auth: AuthContext = Depends(require_permission("audit.view")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get audit logs for tenant."""
    logs = AuditService.get_logs(
        db=db,
        tenant_id=tenant.tenant_id,
        action=action,
        resource=resource,
        limit=limit,
        offset=offset
    )
    
    # Manually serialize to avoid metadata serialization issues
    return [
        {
            "id": str(log.id),
            "tenant_id": str(log.tenant_id) if log.tenant_id else None,
            "actor_id": str(log.actor_id) if log.actor_id else None,
            "action": log.action,
            "resource": log.resource,
            "resource_id": str(log.resource_id) if log.resource_id else None,
            "meta_data": log.meta_data if log.meta_data else {},
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

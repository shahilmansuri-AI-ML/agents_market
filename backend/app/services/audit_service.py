from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID

from app.models.audit_log import AuditLog


class AuditService:
    
    @staticmethod
    def log(
        db: Session,
        tenant_id: Optional[UUID],
        actor_id: Optional[UUID],
        action: str,
        resource: str,
        resource_id: Optional[UUID] = None,
        meta_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Create an audit log entry."""
        audit_log = AuditLog(
            tenant_id=tenant_id,
            actor_id=actor_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            meta_data=meta_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def get_logs(
        db: Session,
        tenant_id: Optional[UUID] = None,
        actor_id: Optional[UUID] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ):
        """Get audit logs with filters."""
        query = db.query(AuditLog)
        
        if tenant_id:
            query = query.filter(AuditLog.tenant_id == tenant_id)
        if actor_id:
            query = query.filter(AuditLog.actor_id == actor_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if resource:
            query = query.filter(AuditLog.resource == resource)
        
        query = query.order_by(AuditLog.created_at.desc())
        query = query.limit(limit).offset(offset)
        
        return query.all()

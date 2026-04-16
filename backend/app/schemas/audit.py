from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class AuditLogCreate(BaseModel):
    action: str
    resource: str
    resource_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditLogResponse(BaseModel):
    id: UUID
    tenant_id: Optional[UUID]
    actor_id: Optional[UUID]
    action: str
    resource: str
    resource_id: Optional[UUID]
    metadata: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

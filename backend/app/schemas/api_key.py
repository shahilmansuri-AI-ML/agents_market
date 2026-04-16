from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class APIKeyCreate(BaseModel):
    name: str
    expires_at: Optional[datetime] = None
    allowed_agent_ids: Optional[List[UUID]] = []


class APIKeyResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: UUID
    name: str
    prefix: str
    status: str
    allowed_agent_ids: Optional[List[UUID]]
    created_at: datetime
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]

    class Config:
        from_attributes = True


class APIKeyCreateResponse(BaseModel):
    api_key: str
    key_info: APIKeyResponse

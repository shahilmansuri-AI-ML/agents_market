from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class TenantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    domain: Optional[str] = None


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    domain: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TenantWithRole(TenantResponse):
    user_role: Optional[str] = None
    user_status: Optional[str] = None

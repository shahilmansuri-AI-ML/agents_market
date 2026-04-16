from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: List[UUID] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class RoleResponse(BaseModel):
    id: UUID
    tenant_id: Optional[UUID]
    name: str
    description: Optional[str]
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RoleWithPermissions(RoleResponse):
    permissions: List[str] = []


class AssignRoleRequest(BaseModel):
    user_id: UUID
    role_id: UUID


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

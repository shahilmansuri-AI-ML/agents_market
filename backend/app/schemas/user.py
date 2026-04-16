from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    is_verified: bool
    is_super_admin: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role_id: UUID


class UserWithRole(UserResponse):
    role_name: Optional[str] = None
    tenant_status: Optional[str] = None

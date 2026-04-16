from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class InvitationCreate(BaseModel):
    email: EmailStr
    role_id: UUID


class InvitationResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    role_id: UUID
    token: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    token: str
    password: str

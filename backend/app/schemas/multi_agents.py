from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class MultiAgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str
    tags: List[str] = []
    agent_type: str = "multi"
    visibility: Optional[str] = "private"
    is_api_enabled: Optional[bool] = False


class MultiAgentResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    status: str
    agent_type: str
    tags: List[str]
    visibility: Optional[str] = None
    is_api_enabled: Optional[bool] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class MultiAgentResponseWithMessage(BaseModel):
    agent: dict
    message: str
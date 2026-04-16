from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime


class AgentVersionCreate(BaseModel):
    version: Optional[str] = Field(default=None, example="1.0.0")
    json_spec: Optional[Dict[str, Any]] = None


class AgentVersionResponse(BaseModel):
    id: UUID
    multi_agent_id: UUID
    version: str
    json_spec: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AgentVersionListResponse(BaseModel):
    versions: List[AgentVersionResponse]
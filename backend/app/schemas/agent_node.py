from pydantic import BaseModel
from typing import Dict, Any
from uuid import UUID


class AgentNodeCreate(BaseModel):
    id: UUID
    type: str
    config: Dict[str, Any]


class AgentNodeResponse(BaseModel):
    id: UUID
    agent_version_id: UUID
    type: str
    config: Dict[str, Any]

    class Config:
        from_attributes = True
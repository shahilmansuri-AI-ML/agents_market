from pydantic import BaseModel
from typing import Dict, Any


class AgentNodeCreate(BaseModel):
    id: str
    type: str
    config: Dict[str, Any]


class AgentNodeResponse(BaseModel):
    id: str
    agent_version_id: str
    type: str
    config: Dict[str, Any]

    class Config:
        from_attributes = True

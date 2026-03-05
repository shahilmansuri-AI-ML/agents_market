from pydantic import BaseModel, Field
from typing import Dict, Any
from uuid import UUID


class AgentVersionCreate(BaseModel):
    version: str = Field(..., example="1.0.0")
    json_spec: Dict[str, Any]


class AgentVersionResponse(BaseModel):
    id: UUID
    multi_agent_id: UUID
    version: str
    json_spec: Dict[str, Any]

    class Config:
        from_attributes = True
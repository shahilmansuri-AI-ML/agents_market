from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, Any
from datetime import datetime
from app.schemas.tool import ToolOut


class SingleAgentCreate(BaseModel):
    
    name: str
    description: Optional[str] = None
    instruction: str
    tool_id: int
    config_json: Optional[dict[str, Any]] = None
    tool_config_json: Optional[dict[str, Any]] = None
    agent_type: str = "single"
    visibility: Optional[str] = "private"
    is_api_enabled: Optional[bool] = False


class SingleAgentResponse(BaseModel):
    single_agent_id: UUID = Field(alias="id")
    tenant_id: UUID
    name: str
    description: Optional[str]
    instruction: str
    tool_id: int
    status: str
    agent_type: str   
    visibility: Optional[str] = None
    is_api_enabled: Optional[bool] = None
    created_at: Optional[datetime]
    tool: Optional[ToolOut] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class SingleAgentCreateResponse(BaseModel):
    message: str
    agent: dict
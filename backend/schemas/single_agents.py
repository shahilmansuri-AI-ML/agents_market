from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from schemas.tool import ToolOut 

# Create schema
class SingleAgentCreate(BaseModel):
    tenant_id: str
    name: str
    description: Optional[str] = None
    instruction: str
    tool_id: int


# Response schema
class SingleAgentResponse(BaseModel):
    single_agent_id: UUID = Field(alias="id")
    tenant_id: str
    name: str
    description: Optional[str]
    tool_id: int
    tool: ToolOut

    class Config:
        from_attributes = True
        populate_by_name = True


# Create response schema
class SingleAgentCreateResponse(BaseModel):
    message: str
    agent: SingleAgentResponse

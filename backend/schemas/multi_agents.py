from pydantic import BaseModel
from typing import List
from uuid import UUID


class MultiAgentCreate(BaseModel):
    tenant_id: str
    name: str
    status: str
    tags: List[str] = []


class MultiAgentResponse(BaseModel):
    id: UUID
    tenant_id: str
    name: str
    status: str
    tags: List[str]

    class Config:
        from_attributes = True


class MultiAgentResponseWithMessage(BaseModel):
    agent: MultiAgentResponse
    message: str

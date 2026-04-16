from pydantic import BaseModel
from uuid import UUID
from typing import Literal, Optional


class DeployAgentRequest(BaseModel):
    agent_id: UUID
    tenant_id: UUID
    agent_type: Literal["single", "multi"]


class DeploymentResponse(BaseModel):
    status: str
    deployment_id: str
    agent_type: str
    agent_id: str
    agent_version_id: Optional[str] = None
    message: str
    workflow_id: Optional[str] = None
    nodes_count: Optional[int] = 0
    edges_count: Optional[int] = 0
       

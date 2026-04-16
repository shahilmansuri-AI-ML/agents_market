from pydantic import BaseModel
from uuid import UUID


class DeployAgentRequest(BaseModel):
    agent_id: UUID
    tenant_id: UUID
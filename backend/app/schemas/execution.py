from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ExecuteDeploymentRequest(BaseModel):
    target_id: UUID
    tenant_id: UUID
    agent_type: Literal["single", "multi"]
    text: str = Field(..., min_length=1, description="User input text for execution")
    triggered_by_user_id: Optional[UUID] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "target_id": "11111111-1111-1111-1111-111111111111",
                "tenant_id": "22222222-2222-2222-2222-222222222222",
                "agent_type": "single",
                "text": "Hello, can you help me?",
                "triggered_by_user_id": "33333333-3333-3333-3333-333333333333",
            }
        }
    )


class ExecutionResponse(BaseModel):
    status: str
    execution_id: str
    target_id: str
    agent_type: str
    deployment_id: Optional[str] = None
    response: str
    # raw_output: Optional[Any] = None


class ExecutionStatusResponse(BaseModel):
    execution_id: str
    status: str
    deployment_id: Optional[str] = None
    current_step_key: Optional[str] = None
    output_payload: Optional[Any] = None
    error_message: Optional[str] = None
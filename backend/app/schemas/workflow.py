from pydantic import BaseModel
from typing import Any, Dict, List


class WorkflowCreate(BaseModel):
    # ✅ Frontend { workflow_json: { nodes: [...], edges: [...] } } se match karta hai
    workflow_json: Dict[str, List[Any]]


class WorkflowResponse(BaseModel):
    workflow_id: str
    workflow_json: Dict[str, List[Any]]

    class Config:
        from_attributes = True   # ✅ Pydantic v2 mein orm_mode deprecated hai
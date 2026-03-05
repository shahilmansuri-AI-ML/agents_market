from pydantic import BaseModel
from typing import Any, List

class WorkflowCreate(BaseModel):
    nodes: List[Any]
    edges: List[Any]
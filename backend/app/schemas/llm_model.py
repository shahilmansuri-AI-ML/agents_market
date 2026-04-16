from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class LLMModelBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider_name: str
    model_name: str
    model_api: str

class LLMModelCreate(LLMModelBase):
    pass

class LLMModelUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider_name: Optional[str] = None
    model_name: Optional[str] = None
    model_api: Optional[str] = None

class LLMModelOut(LLMModelBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=(),
    )
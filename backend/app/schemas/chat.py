from pydantic import BaseModel
from uuid import UUID
from typing import List


class CreateConversation(BaseModel):
    tenant_id: UUID
    agent_id: str


class MessageCreate(BaseModel):
    conversation_id: UUID
    role: str
    content: str


class MessageResponse(BaseModel):
    role: str
    content: str


class ConversationResponse(BaseModel):
    id: UUID
    title: str

    class Config:
        from_attributes = True
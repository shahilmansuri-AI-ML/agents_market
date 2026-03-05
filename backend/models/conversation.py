from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from db.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(150), nullable=False)
    agent_id = Column(String, nullable=False)  # UUID → STRING
    title = Column(Text, default="New Chat")
    created_at = Column(DateTime, server_default=func.now())
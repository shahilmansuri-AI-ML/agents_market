import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    tenant_id = Column(String(150), nullable=False, index=True)

    agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("single_agents.id"),
        nullable=False
    )

    title = Column(String(200), default="New Chat")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
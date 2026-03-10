import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base


class AgentVersion(Base):
    __tablename__ = "agent_versions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("single_agents.id"),
        nullable=False
    )

    version = Column(String(50), nullable=False)

    instruction = Column(Text, nullable=False)

    llm_model = Column(String(150), nullable=False)

    temperature = Column(String(50), default="0.7")

    status = Column(String(50), default="draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
import uuid
from sqlalchemy import Column, ForeignKey, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database.session import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    multi_agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("multi_agents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    name = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)

    workflow_json = Column(
        JSONB,
        nullable=False,
        default=lambda: {"nodes": [], "edges": []}
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database.session import Base


class AgentVersion(Base):
    __tablename__ = "agent_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    multi_agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("multi_agents.id", ondelete="CASCADE"),
        nullable=False
    )

    version = Column(String(50), nullable=False)
    json_spec = Column(JSONB, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("multi_agent_id", "version", name="uq_multi_agent_version"),
    )
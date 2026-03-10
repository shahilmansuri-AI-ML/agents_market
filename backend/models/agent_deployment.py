import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base


class AgentDeployment(Base):
    __tablename__ = "agent_deployments"

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

    version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_versions.id"),
        nullable=False
    )

    runtime_framework = Column(String(100))

    status = Column(String(50), default="inactive")

    deployed_at = Column(DateTime(timezone=True), server_default=func.now())
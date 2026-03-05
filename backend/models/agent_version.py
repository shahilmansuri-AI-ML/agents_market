import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from db.database import Base


class AgentVersion(Base):
    __tablename__ = "agent_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    multi_agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("multi_agents.id", ondelete="CASCADE"),
        nullable=False
    )

    version = Column(String(255), nullable=False)

    json_spec = Column(JSONB, nullable=False)
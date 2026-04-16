import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database.session import Base


class AgentNode(Base):
    __tablename__ = "agent_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    agent_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_versions.id", ondelete="CASCADE"),
        nullable=False
    )

    type = Column(String(50), nullable=False)

    config = Column(JSONB, nullable=False)
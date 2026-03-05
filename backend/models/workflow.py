from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from db.database import Base


class Workflow(Base):

    __tablename__ = "workflows"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    multi_agent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("multi_agents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    nodes = Column(
        JSONB,
        nullable=False
    )

    edges = Column(
        JSONB,
        nullable=False
    )

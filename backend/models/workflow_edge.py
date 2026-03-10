import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.base import Base


class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id"),
        nullable=False
    )

    source_node = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_nodes.id")
    )

    target_node = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_nodes.id")
    )
import uuid
from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base


class SingleAgent(Base):
    __tablename__ = "single_agents"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    # changed String -> UUID
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    name = Column(Text, nullable=False)

    description = Column(Text)

    # added missing column
    instruction = Column(Text, nullable=False)

    tool_id = Column(
        Integer,
        ForeignKey("tools.tool_id"),
        nullable=False
    )

    tool = relationship("Tool")
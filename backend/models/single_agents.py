import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base


class SingleAgent(Base):
    __tablename__ = "single_agents"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    tenant_id = Column(String(150), nullable=False, index=True)

    name = Column(String(200), nullable=False)

    description = Column(Text)

    instruction = Column(Text, nullable=False)

    llm_model = Column(String(150), nullable=False)

    temperature = Column(String(50), default="0.7")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship with tools through mapping table
    tools = relationship(
        "Tool",
        secondary="agent_tools",
        backref="agents"
    )
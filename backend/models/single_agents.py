from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid
from models.tool import Tool


class SingleAgent(Base):
    __tablename__ = "single_agents"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    tenant_id = Column(String(150), nullable=False)

    name = Column(Text, nullable=False)

    description = Column(Text)

    tool_id = Column(
        Integer,
        ForeignKey("tools.tool_id"),
        nullable=False
    )

    tool = relationship("Tool")
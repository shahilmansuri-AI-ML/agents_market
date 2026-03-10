import uuid
from sqlalchemy import Column, String, Text, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from db.base import Base


class Tool(Base):
    __tablename__ = "tools"

    tool_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    tenant_id = Column(String(150), nullable=False, index=True)

    name = Column(String(200), nullable=False)

    description = Column(Text)

    tool_type = Column(String(100), nullable=False)

    config = Column(JSON)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
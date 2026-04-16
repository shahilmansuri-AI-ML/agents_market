import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.types import Text
from sqlalchemy.sql import func
from app.database.session import Base


class MultiAgent(Base):
    __tablename__ = "multi_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)   # FIXED
    status = Column(String(20), nullable=False)

    agent_type = Column(String(20), nullable=False, default="multi")   # NEW
    tags = Column(ARRAY(Text), default=[])

    # Agent-as-API fields
    visibility = Column(String(20), default="private", nullable=False)  # private | public
    is_api_enabled = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from app.database.session import Base


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(Text, nullable=False)
    key_hash = Column(Text, unique=True, nullable=False)
    prefix = Column(Text, nullable=False, index=True)
    status = Column(String(20), default="active", nullable=False)
    
    # Agent-as-API: scope to specific agents
    allowed_agent_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
    
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)

import uuid
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class SingleAgent(Base):
    __tablename__ = "single_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    instruction = Column(Text, nullable=False)
    tool_id = Column(Integer, ForeignKey("tools.tool_id"), nullable=False)
    
    agent_type = Column(String(20), nullable=False, default="single")   # 
    status = Column(String(20), default="DRAFT", nullable=False)  # DRAFT, DEPLOYED, FAILED
    
    # Agent-as-API fields
    visibility = Column(String(20), default="private", nullable=False)  # private | public
    is_api_enabled = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    tool = relationship("Tool")
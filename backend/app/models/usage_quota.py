import uuid
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class UsageQuota(Base):
    __tablename__ = "usage_quotas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consumer_tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("single_agents.id", ondelete="CASCADE"), nullable=False, index=True)
    monthly_limit = Column(Integer, nullable=False, default=-1)
    used_count = Column(Integer, nullable=False, default=0)
    reset_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('consumer_tenant_id', 'agent_id', name='uq_consumer_agent'),
    )

    consumer_tenant = relationship("Tenant", foreign_keys=[consumer_tenant_id])
    agent = relationship("SingleAgent", foreign_keys=[agent_id])

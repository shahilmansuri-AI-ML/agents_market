import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action = Column(Text, nullable=False, index=True)
    resource = Column(Text, nullable=False, index=True)
    resource_id = Column(UUID(as_uuid=True))
    meta_data = Column('metadata', JSONB)
    ip_address = Column(Text)
    user_agent = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), index=True)

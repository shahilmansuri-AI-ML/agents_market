import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    tenant_id = Column(String(150), nullable=False, index=True)

    name = Column(String(200), nullable=False)

    description = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
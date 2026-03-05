import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.types import Text
from db.database import Base

class MultiAgent(Base):
    __tablename__ = "multi_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String(50), nullable=False)
    name = Column(String(150), nullable=False)
    status = Column(String(20), nullable=False)
    tags = Column(ARRAY(Text), default=[])

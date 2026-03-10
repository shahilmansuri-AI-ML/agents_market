from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB, UUID
from db.database import Base
import uuid


class Persona(Base):
    __tablename__ = "personas"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    tenant_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    config_json = Column(JSONB, nullable=False)
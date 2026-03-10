from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from db.database import Base
import uuid


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    tenant_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    content = Column(Text, nullable=False)

    tags = Column(ARRAY(Text))
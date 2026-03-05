from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from db.database import Base


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String(50), primary_key=True)

    tenant_id = Column(String(50), nullable=False)

    content = Column(Text, nullable=False)

    tags = Column(ARRAY(Text))

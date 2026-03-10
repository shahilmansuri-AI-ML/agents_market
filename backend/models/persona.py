from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB
from db.base import Base


class Persona(Base):
    __tablename__ = "personas"

    id = Column(String(50), primary_key=True)

    tenant_id = Column(String(50), nullable=False)

    config_json = Column(JSONB, nullable=False)

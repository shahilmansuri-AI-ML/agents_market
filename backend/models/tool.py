from sqlalchemy import Column, Integer, String
from db.database import Base
# from sqlalchemy.connectors import


class Tool(Base):
    __tablename__ = "tools"

    tool_id = Column(Integer, primary_key=True, index=True)
    tool_name = Column(String(255), unique=True, nullable=False)
    tool_api = Column(String(500), nullable=False)
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database.session import Base


class Tool(Base):
    __tablename__ = "tools"

    tool_id = Column(Integer, primary_key=True, index=True)
    tool_name = Column(String(100), unique=True, nullable=False)
    tool_api = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
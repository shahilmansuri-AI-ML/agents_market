from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.base import Base


class AgentTool(Base):
    __tablename__ = "agent_tools"

    agent_id = Column(UUID(as_uuid=True), ForeignKey("single_agents.id"), primary_key=True)

    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.tool_id"), primary_key=True)
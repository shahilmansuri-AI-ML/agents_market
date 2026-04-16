import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database.session import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    # Primary key jo automatically unique UUID generate karegi
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        index=True
    )
    
    # Dusri IDs ko bhi UUID format mein rakha hai
    session_id = Column(UUID(as_uuid=True), default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    agent_id = Column(UUID(as_uuid=True), nullable=True)
    
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    # Agar aap updated_at bhi rakhna chahte hain:
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
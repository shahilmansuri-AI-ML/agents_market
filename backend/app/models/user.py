import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)
    status = Column(String(20), default="active", nullable=False)
    
    # Profile fields
    full_name = Column(String(255))
    profile_picture_url = Column(Text)
    job_title = Column(String(100))
    last_password_change = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships (commented out for now - will be added after models are properly imported)
    # password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    # sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

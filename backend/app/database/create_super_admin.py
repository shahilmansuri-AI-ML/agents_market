"""
Script to create super admin user during initialization.
This will be called from the Docker entrypoint.
"""
import sys
import os
from sqlalchemy.orm import Session

# Add the current directory to the Python path
sys.path.append('/app')

from app.database.session import engine, SessionLocal
from app.models.user import User
from app.utils.hashing import hash_password_util
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_super_admin():
    """Create super admin user if it doesn't exist."""
    db = SessionLocal()
    try:
        # Check if super admin already exists
        super_admin = db.query(User).filter(User.email == "admin@media2ai.com").first()
        
        if super_admin:
            logger.info("Super admin user already exists")
            # Update password and ensure super admin status
            super_admin.password_hash = hash_password_util("superpassword123")
            super_admin.is_super_admin = True
            super_admin.is_verified = True
            super_admin.status = "active"
            db.commit()
            logger.info("Super admin user updated")
        else:
            # Create new super admin user
            hashed_password = hash_password_util("superpassword123")
            super_admin = User(
                email="admin@media2ai.com",
                password_hash=hashed_password,
                is_verified=True,
                is_super_admin=True,
                status="active"
            )
            db.add(super_admin)
            db.commit()
            logger.info("Super admin user created successfully")
            
    except Exception as e:
        logger.error(f"Error creating super admin: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()

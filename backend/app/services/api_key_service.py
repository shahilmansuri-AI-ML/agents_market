from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from uuid import UUID

from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate
from app.utils.hashing import generate_api_key, verify_api_key
from app.config.settings import settings


class APIKeyService:
    
    @staticmethod
    def create_api_key(
        db: Session,
        tenant_id: UUID,
        user_id: UUID,
        request: APIKeyCreate
    ) -> dict:
        """Create a new API key."""
        # Generate API key
        full_key, prefix, key_hash = generate_api_key(settings.API_KEY_PREFIX_LENGTH)
        
        # Create API key record
        api_key = APIKey(
            tenant_id=tenant_id,
            user_id=user_id,
            name=request.name,
            key_hash=key_hash,
            prefix=prefix,
            status="active",
            allowed_agent_ids=request.allowed_agent_ids or [],
            expires_at=request.expires_at
        )
        
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        
        return {
            "api_key": full_key,
            "key_info": api_key
        }
    
    @staticmethod
    def verify_api_key(db: Session, api_key: str) -> tuple:
        """Verify API key and return tenant_id and user_id."""
        # Extract prefix
        if "." not in api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key format"
            )
        
        prefix = api_key.split(".")[0]
        
        # Find API key by prefix
        key_record = db.query(APIKey).filter(
            APIKey.prefix == prefix,
            APIKey.status == "active"
        ).first()
        
        if not key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        # Verify key hash
        if not verify_api_key(api_key, key_record.key_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        # Check expiration
        if key_record.expires_at and key_record.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )
        
        # Update last used timestamp
        key_record.last_used_at = datetime.utcnow()
        db.commit()
        
        return key_record.tenant_id, key_record.user_id
    
    @staticmethod
    def get_tenant_api_keys(db: Session, tenant_id: UUID):
        """Get all API keys for a tenant."""
        return db.query(APIKey).filter(
            APIKey.tenant_id == tenant_id
        ).order_by(APIKey.created_at.desc()).all()
    
    @staticmethod
    def revoke_api_key(db: Session, api_key_id: UUID, tenant_id: UUID):
        """Revoke an API key."""
        api_key = db.query(APIKey).filter(
            APIKey.id == api_key_id,
            APIKey.tenant_id == tenant_id
        ).first()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        api_key.status = "revoked"
        db.commit()
        
        return {"message": "API key revoked successfully"}

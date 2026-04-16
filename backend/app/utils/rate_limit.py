import time
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
from app.config.settings import settings

# In-memory storage for rate limiting (replaces Redis)
rate_limit_store = {}


def check_rate_limit(identifier: str, limit: int = None) -> bool:
    """Check if rate limit is exceeded."""
    if limit is None:
        limit = settings.RATE_LIMIT_PER_MINUTE
    
    key = f"rate_limit:{identifier}"
    now = datetime.now()
    
    # Clean up expired entries
    expired_keys = [k for k, v in rate_limit_store.items() if now > v["expires_at"]]
    for k in expired_keys:
        rate_limit_store.pop(k, None)
    
    # Check current rate limit
    current_data = rate_limit_store.get(key)
    
    if current_data is None:
        # First request from this identifier
        rate_limit_store[key] = {
            "count": 1,
            "expires_at": now + timedelta(seconds=60)
        }
        return True
    
    if current_data["count"] >= limit:
        return False
    
    # Increment count
    current_data["count"] += 1
    return True


async def rate_limit_dependency(request: Request):
    """FastAPI dependency for rate limiting."""
    client_ip = request.client.host
    
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )

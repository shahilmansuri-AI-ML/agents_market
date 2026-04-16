from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from uuid import UUID

from app.database.session import get_db
from app.models.usage_quota import UsageQuota
from app.models.api_key import APIKey


class QuotaExceeded(HTTPException):
    """Custom exception for quota exceeded."""
    def __init__(self, used: int, limit: int, reset_at: datetime):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "quota_exceeded",
                "used": used,
                "limit": limit,
                "reset_at": reset_at.isoformat()
            }
        )


def enforce_usage_quota(
    agent_id: UUID,
    api_key: APIKey,
    db: Session = Depends(get_db)
):
    """
    Enforces usage quota for API key accessing an agent.
    
    Args:
        agent_id: The agent being accessed
        api_key: The authenticated API key object
        db: Database session
        
    Raises:
        QuotaExceeded: If monthly quota is exceeded
        
    Returns:
        dict with quota info and warning flag
    """
    consumer_tenant_id = api_key.tenant_id
    
    # Look up or create usage quota
    quota = db.query(UsageQuota).filter(
        UsageQuota.consumer_tenant_id == consumer_tenant_id,
        UsageQuota.agent_id == agent_id
    ).first()
    
    if not quota:
        # Create new quota with default unlimited (-1)
        next_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = next_month + relativedelta(months=1)
        
        quota = UsageQuota(
            consumer_tenant_id=consumer_tenant_id,
            agent_id=agent_id,
            monthly_limit=-1,
            used_count=0,
            reset_at=next_month
        )
        db.add(quota)
        db.commit()
        db.refresh(quota)
    
    # Check if quota needs reset
    now = datetime.now(timezone.utc)
    if now >= quota.reset_at:
        # Reset quota to first of next month
        next_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = next_month + relativedelta(months=1)
        
        quota.used_count = 0
        quota.reset_at = next_month
        db.commit()
    
    # Check if quota exceeded (only if limit is set, -1 means unlimited)
    if quota.monthly_limit != -1 and quota.used_count >= quota.monthly_limit:
        raise QuotaExceeded(
            used=quota.used_count,
            limit=quota.monthly_limit,
            reset_at=quota.reset_at
        )
    
    # Calculate warning threshold
    should_warn = False
    if quota.monthly_limit != -1 and quota.monthly_limit > 0:
        usage_percentage = quota.used_count / quota.monthly_limit
        if usage_percentage >= 0.8:
            should_warn = True
    
    return {
        "quota": quota,
        "should_warn": should_warn,
        "usage_percentage": (quota.used_count / quota.monthly_limit * 100) if quota.monthly_limit > 0 else 0
    }

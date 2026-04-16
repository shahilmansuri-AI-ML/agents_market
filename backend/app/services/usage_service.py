from sqlalchemy.orm import Session
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from uuid import UUID

from app.models.api_usage_log import APIUsageLog
from app.models.usage_quota import UsageQuota


class UsageService:
    """Service for tracking API usage and managing quotas."""
    
    @staticmethod
    def record_call(
        db: Session,
        consumer_tenant_id: UUID,
        owner_tenant_id: UUID,
        agent_id: UUID,
        api_key_id: UUID,
        status_code: int,
        latency_ms: int
    ):
        """
        Records an API call and increments usage quota.
        
        All operations are performed in a single transaction.
        If today >= reset_at, resets used_count and sets new reset_at.
        
        Args:
            db: Database session
            consumer_tenant_id: Tenant making the API call
            owner_tenant_id: Tenant owning the agent
            agent_id: Agent being called
            api_key_id: API key used for authentication
            status_code: HTTP status code of the response
            latency_ms: Response time in milliseconds
        """
        # 1. Insert usage log
        usage_log = APIUsageLog(
            api_key_id=api_key_id,
            agent_id=agent_id,
            consumer_tenant_id=consumer_tenant_id,
            provider_tenant_id=owner_tenant_id,
            response_time_ms=latency_ms,
            status_code=status_code
        )
        db.add(usage_log)
        
        # 2. Get or create usage quota
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
                used_count=1,  # Start at 1 for this call
                reset_at=next_month
            )
            db.add(quota)
        else:
            # 3. Check if quota needs reset
            now = datetime.now(timezone.utc)
            if now >= quota.reset_at:
                # Reset to first of next month
                next_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                next_month = next_month + relativedelta(months=1)
                
                quota.used_count = 1  # Reset and count this call
                quota.reset_at = next_month
            else:
                # Just increment
                quota.used_count += 1
            
            quota.updated_at = datetime.now(timezone.utc)
        
        # Commit all changes in single transaction
        db.commit()

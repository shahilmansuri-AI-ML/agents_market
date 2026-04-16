from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from uuid import UUID
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from typing import List
from pydantic import BaseModel

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_tenant, TenantContext
from app.models.single_agent import SingleAgent
from app.models.api_usage_log import APIUsageLog
from app.models.usage_quota import UsageQuota


router = APIRouter(prefix="/usage", tags=["Usage & Quotas"])


# ========== SCHEMAS ==========

class AgentUsageStats(BaseModel):
    agent_id: str
    agent_name: str
    total_calls_all_time: int
    calls_this_month: int
    unique_consumers_this_month: int
    error_rate_this_month: float


class ConsumptionStats(BaseModel):
    agent_id: str
    agent_name: str
    owner_tenant_id: str
    calls_this_month: int
    monthly_limit: int
    used_count: int
    reset_at: str


class QuotaUpdateRequest(BaseModel):
    consumer_tenant_id: str
    monthly_limit: int


# ========== ENDPOINTS ==========

@router.get("/my-agents", response_model=List[AgentUsageStats])
def get_my_agents_usage(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get usage statistics for all public+api_enabled agents owned by current tenant.
    Owner perspective: see who's calling your agents.
    """
    # Get all public+api_enabled agents owned by this tenant
    agents = db.query(SingleAgent).filter(
        SingleAgent.tenant_id == tenant.tenant_id,
        SingleAgent.visibility == "public",
        SingleAgent.is_api_enabled == True
    ).all()
    
    if not agents:
        return []
    
    agent_ids = [agent.id for agent in agents]
    
    # Calculate start of current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    results = []
    
    for agent in agents:
        # Total calls all time
        total_calls = db.query(func.count(APIUsageLog.id)).filter(
            APIUsageLog.agent_id == agent.id
        ).scalar() or 0
        
        # Calls this month
        calls_this_month = db.query(func.count(APIUsageLog.id)).filter(
            APIUsageLog.agent_id == agent.id,
            APIUsageLog.created_at >= month_start
        ).scalar() or 0
        
        # Unique consumers this month
        unique_consumers = db.query(
            func.count(func.distinct(APIUsageLog.consumer_tenant_id))
        ).filter(
            APIUsageLog.agent_id == agent.id,
            APIUsageLog.created_at >= month_start
        ).scalar() or 0
        
        # Error rate this month (status >= 400)
        total_this_month = calls_this_month
        errors_this_month = db.query(func.count(APIUsageLog.id)).filter(
            APIUsageLog.agent_id == agent.id,
            APIUsageLog.created_at >= month_start,
            APIUsageLog.status_code >= 400
        ).scalar() or 0
        
        error_rate = (errors_this_month / total_this_month * 100) if total_this_month > 0 else 0.0
        
        results.append(AgentUsageStats(
            agent_id=str(agent.id),
            agent_name=agent.name,
            total_calls_all_time=total_calls,
            calls_this_month=calls_this_month,
            unique_consumers_this_month=unique_consumers,
            error_rate_this_month=round(error_rate, 2)
        ))
    
    return results


@router.get("/my-consumption", response_model=List[ConsumptionStats])
def get_my_consumption(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get consumption statistics for agents this tenant has called this month.
    Consumer perspective: see what you're using.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Calculate start of current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    logger.info(f"[MY-CONSUMPTION] tenant_id={tenant.tenant_id}, month_start={month_start}")
    
    # Get all agents this tenant has called this month
    called_agents = db.query(
        APIUsageLog.agent_id,
        func.count(APIUsageLog.id).label('calls_count')
    ).filter(
        APIUsageLog.consumer_tenant_id == tenant.tenant_id,
        APIUsageLog.created_at >= month_start
    ).group_by(APIUsageLog.agent_id).all()
    
    logger.info(f"[MY-CONSUMPTION] Found {len(called_agents)} agents called by this tenant")
    
    if not called_agents:
        logger.warning(f"[MY-CONSUMPTION] No agents found for tenant {tenant.tenant_id}")
        return []
    
    results = []
    
    for agent_id, calls_count in called_agents:
        logger.info(f"[MY-CONSUMPTION] Processing agent_id={agent_id}, calls={calls_count}")
        
        # Get agent details
        agent = db.query(SingleAgent).filter(SingleAgent.id == agent_id).first()
        if not agent:
            logger.warning(f"[MY-CONSUMPTION] Agent {agent_id} not found in database")
            continue
        
        logger.info(f"[MY-CONSUMPTION] Found agent: {agent.name}, owner={agent.tenant_id}")
        
        # Get quota info
        quota = db.query(UsageQuota).filter(
            UsageQuota.consumer_tenant_id == tenant.tenant_id,
            UsageQuota.agent_id == agent_id
        ).first()
        
        if quota:
            monthly_limit = quota.monthly_limit
            used_count = quota.used_count
            reset_at = quota.reset_at.isoformat()
            logger.info(f"[MY-CONSUMPTION] Quota found: limit={monthly_limit}, used={used_count}")
        else:
            # No quota set, defaults to unlimited
            monthly_limit = -1
            used_count = 0
            next_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = next_month + relativedelta(months=1)
            reset_at = next_month.isoformat()
            logger.info(f"[MY-CONSUMPTION] No quota found, using defaults")
        
        result = ConsumptionStats(
            agent_id=str(agent.id),
            agent_name=agent.name,
            owner_tenant_id=str(agent.tenant_id),
            calls_this_month=calls_count,
            monthly_limit=monthly_limit,
            used_count=used_count,
            reset_at=reset_at
        )
        results.append(result)
        logger.info(f"[MY-CONSUMPTION] Added result: {result.dict()}")
    
    logger.info(f"[MY-CONSUMPTION] Returning {len(results)} results")
    return results


@router.get("/agents/{agent_id}/consumers")
def get_agent_consumers(
    agent_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get list of tenants who have consumed this agent via API.
    Only the agent owner can view this.
    """
    from app.models.tenant import Tenant
    
    agent_uuid = UUID(agent_id)
    
    # Validate agent exists and belongs to current tenant
    agent = db.query(SingleAgent).filter(
        SingleAgent.id == agent_uuid,
        SingleAgent.tenant_id == tenant.tenant_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or you don't have permission to view it"
        )
    
    # Get unique consumer tenants from usage logs
    consumers = db.query(
        APIUsageLog.consumer_tenant_id,
        Tenant.name.label('tenant_name'),
        func.count(APIUsageLog.id).label('total_calls')
    ).join(
        Tenant, APIUsageLog.consumer_tenant_id == Tenant.id
    ).filter(
        APIUsageLog.agent_id == agent_uuid
    ).group_by(
        APIUsageLog.consumer_tenant_id,
        Tenant.name
    ).all()
    
    # Get existing quotas
    quotas = db.query(UsageQuota).filter(
        UsageQuota.agent_id == agent_uuid
    ).all()
    
    quota_map = {str(q.consumer_tenant_id): q for q in quotas}
    
    result = []
    for consumer_id, tenant_name, total_calls in consumers:
        quota = quota_map.get(str(consumer_id))
        result.append({
            "tenant_id": str(consumer_id),
            "tenant_name": tenant_name,
            "total_calls": total_calls,
            "monthly_limit": quota.monthly_limit if quota else -1,
            "used_count": quota.used_count if quota else 0,
            "reset_at": quota.reset_at.isoformat() if quota else None
        })
    
    return result


@router.put("/quotas/{agent_id}")
def update_quota(
    agent_id: str,
    quota_request: QuotaUpdateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Set or update usage quota for a consumer tenant accessing your agent.
    Only the agent owner can set quotas.
    """
    agent_uuid = UUID(agent_id)
    consumer_tenant_uuid = UUID(quota_request.consumer_tenant_id)
    
    # Validate agent exists and belongs to current tenant
    agent = db.query(SingleAgent).filter(
        SingleAgent.id == agent_uuid,
        SingleAgent.tenant_id == tenant.tenant_id
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or you don't have permission to manage it"
        )
    
    # Validate monthly_limit
    if quota_request.monthly_limit < -1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="monthly_limit must be >= -1 (where -1 means unlimited)"
        )
    
    # Get or create quota
    quota = db.query(UsageQuota).filter(
        UsageQuota.consumer_tenant_id == consumer_tenant_uuid,
        UsageQuota.agent_id == agent_uuid
    ).first()
    
    if quota:
        # Update existing quota
        quota.monthly_limit = quota_request.monthly_limit
        quota.updated_at = datetime.now(timezone.utc)
    else:
        # Create new quota
        now = datetime.now(timezone.utc)
        next_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = next_month + relativedelta(months=1)
        
        quota = UsageQuota(
            consumer_tenant_id=consumer_tenant_uuid,
            agent_id=agent_uuid,
            monthly_limit=quota_request.monthly_limit,
            used_count=0,
            reset_at=next_month
        )
        db.add(quota)
    
    db.commit()
    db.refresh(quota)
    
    return {
        "message": "Quota updated successfully",
        "quota": {
            "consumer_tenant_id": str(quota.consumer_tenant_id),
            "agent_id": str(quota.agent_id),
            "monthly_limit": quota.monthly_limit,
            "used_count": quota.used_count,
            "reset_at": quota.reset_at.isoformat()
        }
    }

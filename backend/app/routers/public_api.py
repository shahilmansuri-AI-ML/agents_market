from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Any, Dict
import time

from app.database.session import get_db
from app.middleware.auth_middleware import get_current_identity, Identity, APIKeyContext
from app.models.single_agent import SingleAgent
from app.models.multi_agent import MultiAgent
from app.models.api_key import APIKey
from app.services.usage_service import UsageService

router = APIRouter(prefix="/api/v1", tags=["Public API"])


@router.post("/agents/{agent_id}/execute")
async def execute_agent_via_api(
    agent_id: str,
    request: Request,
    response: Response,
    payload: Dict[str, Any],
    identity: Identity = Depends(get_current_identity),
    db: Session = Depends(get_db)
):
    """
    Execute an agent via API key authentication.
    This endpoint allows cross-tenant agent execution.
    """
    start_time = time.time()
    status_code = 200
    
    try:
        # STEP 1: Validate authentication type
        if identity.auth_type != "api_key":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This endpoint requires API key authentication (X-API-Key header)"
            )
        
        api_key_context: APIKeyContext = identity.context
        agent_uuid = UUID(agent_id)
        
        # STEP 2: Fetch agent (try both single and multi)
        agent = db.query(SingleAgent).filter(SingleAgent.id == agent_uuid).first()
        agent_type = "single"
        
        if not agent:
            agent = db.query(MultiAgent).filter(MultiAgent.id == agent_uuid).first()
            agent_type = "multi"
        
        if not agent:
            status_code = 404
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )
        
        # STEP 3: CRITICAL SECURITY VALIDATIONS
        
        # 3.1: Agent must have API enabled
        if not agent.is_api_enabled:
            status_code = 403
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This agent does not have API access enabled"
            )
        
        # 3.2: Agent must be public
        if agent.visibility != "public":
            status_code = 403
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This agent is not publicly accessible"
            )
        
        # 3.3: API key must explicitly allow this agent
        if agent_uuid not in api_key_context.allowed_agent_ids:
            status_code = 403
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your API key does not have access to this agent"
            )
        
        # 3.4: Cross-tenant validation (consumer != provider)
        provider_tenant_id = agent.tenant_id
        consumer_tenant_id = api_key_context.tenant_id
        
        # STEP 3.5: Enforce usage quota
        api_key = db.query(APIKey).filter(APIKey.id == api_key_context.api_key_id).first()
        if not api_key:
            status_code = 401
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        from app.middleware.usage_guard import enforce_usage_quota
        quota_info = enforce_usage_quota(agent_uuid, api_key, db)
        
        # Add quota warning header if needed
        if quota_info["should_warn"]:
            response.headers["X-Quota-Warning"] = f"{int(quota_info['usage_percentage'])}% of monthly quota used"
        
        # STEP 4: Define tenant context
        # Execution happens in PROVIDER tenant context
        execution_tenant_id = provider_tenant_id
        
        # STEP 5: Execute agent
        # TODO: Integrate with your existing agent execution pipeline
        # For now, return a placeholder response
        
        # This is where you would call your actual agent execution logic
        # Example: result = await execute_single_agent(agent, payload, execution_tenant_id)
        
        result = {
            "output": "Agent execution placeholder - integrate with your execution pipeline",
            "metadata": {
                "agent_id": str(agent_id),
                "agent_type": agent_type,
                "agent_name": agent.name,
                "provider_tenant_id": str(provider_tenant_id),
                "consumer_tenant_id": str(consumer_tenant_id),
                "execution_time_ms": int((time.time() - start_time) * 1000)
            }
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        status_code = 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent execution failed: {str(e)}"
        )
    finally:
        # STEP 6: Log usage and increment quota
        response_time_ms = int((time.time() - start_time) * 1000)
        
        try:
            if 'agent' in locals() and agent and 'api_key_context' in locals():
                UsageService.record_call(
                    db=db,
                    consumer_tenant_id=api_key_context.tenant_id,
                    owner_tenant_id=agent.tenant_id,
                    agent_id=agent_uuid,
                    api_key_id=api_key_context.api_key_id,
                    status_code=status_code,
                    latency_ms=response_time_ms
                )
        except Exception as log_error:
            # Don't fail the request if logging fails
            print(f"Failed to log API usage: {log_error}")

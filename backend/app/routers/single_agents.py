from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database.session import get_db
from app.models.single_agent import SingleAgent
from app.middleware.auth_middleware import (
    get_current_user,
    get_current_tenant,
    AuthContext,
    TenantContext,
    require_permission
)
from app.services.audit_service import AuditService
from app.schemas.single_agents import (
    SingleAgentCreate,
    SingleAgentCreateResponse,
    SingleAgentResponse
)

router = APIRouter(prefix="/single_agents", tags=["Single Agents"])


@router.post("", response_model=SingleAgentCreateResponse)
def create_single_agent(
    data: SingleAgentCreate,
    auth: AuthContext = Depends(require_permission("agents.create")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new single agent."""
    requested_tool_config = data.config_json if data.config_json is not None else data.tool_config_json
    effective_tool_config = requested_tool_config

    if effective_tool_config is None:
        tool_row = db.execute(
            text("""
                SELECT tool_name, tool_api
                FROM tools
                WHERE tool_id = :tool_id
            """),
            {"tool_id": data.tool_id}
        ).mappings().first()

        effective_tool_config = {
            "tool_name": tool_row["tool_name"],
            "tool_api": tool_row["tool_api"]
        } if tool_row else {}

    agent = SingleAgent(
        tenant_id=tenant.tenant_id,
        name=data.name,
        description=data.description,
        instruction=data.instruction,
        tool_id=data.tool_id,
        agent_type="single",   # ✅ auto save type
        visibility=data.visibility,
        is_api_enabled=data.is_api_enabled
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    db.execute(
        text("""
            INSERT INTO agent_tools (agent_id, tool_id, config_json, created_at)
            VALUES (:agent_id, :tool_id, CAST(:config_json AS JSONB), NOW())
            ON CONFLICT (agent_id, tool_id)
            DO UPDATE SET
                config_json = EXCLUDED.config_json
        """),
        {
            "agent_id": agent.id,
            "tool_id": agent.tool_id,
            "config_json": json.dumps(effective_tool_config or {})
        }
    )
    db.commit()

    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="agent_created",
        resource="single_agent",
        resource_id=agent.id,
        meta_data={
            "agent_name": agent.name,
            "agent_type": agent.agent_type
        }
    )

    return {
        "message": "Single agent created successfully",
        "agent": {
            "id": str(agent.id),
            "tenant_id": str(agent.tenant_id),
            "name": agent.name,
            "description": agent.description,
            "instruction": agent.instruction,
            "tool_id": agent.tool_id,
            "agent_type": agent.agent_type,
            "created_at": agent.created_at.isoformat() if agent.created_at else None
        }
    }


@router.get("", response_model=list[SingleAgentResponse])
def list_single_agents(
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all single agents in tenant + public agents from other tenants."""
    from sqlalchemy import or_
    
    agents = db.query(SingleAgent).options(
        joinedload(SingleAgent.tool)
    ).filter(
        or_(
            SingleAgent.tenant_id == tenant.tenant_id,  # Own tenant agents
            SingleAgent.visibility == "public"  # Public agents from all tenants
        )
    ).all()

    return agents


@router.get("/public/api-enabled")
def list_public_api_enabled_agents(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all public agents with API access enabled from all tenants."""
    agents = db.query(SingleAgent).filter(
        SingleAgent.visibility == "public",
        SingleAgent.is_api_enabled == True
    ).all()
    
    return agents


@router.get("/{agent_id}", response_model=SingleAgentResponse)
def get_single_agent(
    agent_id: str,
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get single agent by ID."""
    agent = db.query(SingleAgent).options(
        joinedload(SingleAgent.tool)
    ).filter(
        SingleAgent.id == UUID(agent_id),
        SingleAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    return agent


@router.delete("/{agent_id}")
def delete_single_agent(
    agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.delete")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Delete a single agent."""
    agent = db.query(SingleAgent).filter(
        SingleAgent.id == UUID(agent_id),
        SingleAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    agent_name = agent.name
    db.delete(agent)
    db.commit()

    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="agent_deleted",
        resource="single_agent",
        resource_id=UUID(agent_id),
        meta_data={
            "agent_name": agent_name,
            "agent_type": "single"
        }
    )

    return {"message": "Agent deleted successfully"}


@router.patch("/{agent_id}/undeploy")
def undeploy_single_agent(
    agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.update")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Undeploy a single agent:
    - Sets agent status → DRAFT
    - Marks ACTIVE deployment → INACTIVE
    """

    # 🔍 Fetch agent
    agent = db.query(SingleAgent).filter(
        SingleAgent.id == UUID(agent_id),
        SingleAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # ⚠️ Validate state
    if (agent.status or "").upper() != "DEPLOYED":
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Agent is not deployed"
        )

    # ✅ Step 1: Update agent status
    agent.status = "DRAFT"

    # ✅ Step 2: Deactivate active deployment
    db.execute(
        text("""
            UPDATE deployments
            SET status = 'INACTIVE',
                updated_at = NOW()
            WHERE agent_id = :agent_id
              AND tenant_id = :tenant_id
              AND status = 'ACTIVE'
        """),
        {
            "agent_id": agent_id,
            "tenant_id": str(tenant.tenant_id)
        }
    )

    db.commit()
    db.refresh(agent)

    # 🧾 Audit log
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="agent_undeployed",
        resource="single_agent",
        resource_id=agent.id,
        meta_data={
            "agent_name": agent.name,
            "agent_type": "single",
            "previous_status": "DEPLOYED",
            "new_status": "DRAFT"
        }
    )

    return {
        "message": "Agent undeployed successfully",
        "agent_id": str(agent.id),
        "status": agent.status
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID

from app.database.session import get_db
from app.models.multi_agent import MultiAgent
from app.middleware.auth_middleware import (
    get_current_user,
    get_current_tenant,
    AuthContext,
    TenantContext,
    require_permission
)
from app.services.audit_service import AuditService
from app.schemas.multi_agents import (
    MultiAgentCreate,
    MultiAgentResponse,
    MultiAgentResponseWithMessage,
)

router = APIRouter(prefix="/multi_agents", tags=["Multi Agents"])


@router.post("", response_model=MultiAgentResponseWithMessage)
def create_multi_agent(
    data: MultiAgentCreate,
    auth: AuthContext = Depends(require_permission("agents.create")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    agent = MultiAgent(
        tenant_id=tenant.tenant_id,
        name=data.name,
        description=data.description,
        status=data.status,
        tags=data.tags,
        agent_type="multi",
        visibility=data.visibility,
        is_api_enabled=data.is_api_enabled
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="multi_agent_created",
        resource="multi_agent",
        resource_id=agent.id,
        meta_data={
            "agent_name": agent.name,
            "agent_type": agent.agent_type
        }
    )

    return {
        "agent": {
            "id": str(agent.id),
            "tenant_id": str(agent.tenant_id),
            "name": agent.name,
            "description": agent.description,
            "status": agent.status,
            "agent_type": agent.agent_type,
            "tags": agent.tags,
            "created_at": agent.created_at.isoformat() if agent.created_at else None
        },
        "message": "Multi-agent created successfully"
    }


@router.get("", response_model=list[MultiAgentResponse])
def get_all_multi_agents(
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    from sqlalchemy import or_

    agents = db.query(MultiAgent).filter(
        or_(
            MultiAgent.tenant_id == tenant.tenant_id,
            MultiAgent.visibility == "public"
        )
    ).all()

    return agents


@router.get("/public/api-enabled")
def list_public_api_enabled_multi_agents(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all public multi-agents with API access enabled from all tenants."""
    agents = db.query(MultiAgent).filter(
        MultiAgent.visibility == "public",
        MultiAgent.is_api_enabled == True
    ).all()

    return agents


@router.get("/{agent_id}", response_model=MultiAgentResponse)
def get_multi_agent(
    agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    agent = db.query(MultiAgent).filter(
        MultiAgent.id == UUID(agent_id),
        MultiAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found"
        )

    return agent


@router.patch("/{agent_id}/undeploy")
def undeploy_multi_agent(
    agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.update")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    agent = db.query(MultiAgent).filter(
        MultiAgent.id == UUID(agent_id),
        MultiAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found"
        )

    # 1. multi_agents table → pending
    agent.status = "pending"

    # 2. deployments table → ACTIVE record ko INACTIVE karo
    db.execute(
        text("""
            UPDATE deployments
            SET status     = 'INACTIVE',
                updated_at = NOW()
            WHERE multi_agent_id = :agent_id
              AND tenant_id      = :tenant_id
              AND status         = 'ACTIVE'
        """),
        {
            "agent_id":  agent_id,
            "tenant_id": str(tenant.tenant_id)
        }
    )

    db.commit()
    db.refresh(agent)

    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="multi_agent_undeployed",
        resource="multi_agent",
        resource_id=UUID(agent_id),
        meta_data={
            "agent_name": agent.name,
            "agent_type": "multi",
            "status": "pending"
        }
    )

    return {"message": "Multi-agent undeployed successfully", "status": "pending"}


@router.delete("/{agent_id}")
def delete_multi_agent(
    agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.delete")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    agent = db.query(MultiAgent).filter(
        MultiAgent.id == UUID(agent_id),
        MultiAgent.tenant_id == tenant.tenant_id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Multi-agent not found")

    # Save before deletion — agent object expires after db.delete + commit
    agent_name = agent.name

    try:
        # 1. deployments — uses multi_agent_id column
        db.execute(
            text("DELETE FROM deployments WHERE multi_agent_id = :id"),
            {"id": agent_id}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print("❌ deployments error:", e)

    try:
        # 2. agent_edges — delete before agent_nodes (may reference node ids)
        #    FK constraint name: agent_edges_multi_agent_id_fkey
        db.execute(
            text("DELETE FROM agent_edges WHERE multi_agent_id = :id"),
            {"id": agent_id}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print("❌ agent_edges error:", e)

    try:
        # 3. agent_nodes — FK constraint: agent_nodes_multi_agent_id_fkey
        #    Column is multi_agent_id, NOT agent_id
        db.execute(
            text("DELETE FROM agent_nodes WHERE multi_agent_id = :id"),
            {"id": agent_id}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print("❌ agent_nodes error:", e)

    # Final delete
    try:
        db.delete(agent)
        db.commit()

        # Audit log after successful delete using saved agent_name
        AuditService.log(
            db=db,
            tenant_id=tenant.tenant_id,
            actor_id=auth.user_id,
            action="multi_agent_deleted",
            resource="multi_agent",
            resource_id=UUID(agent_id),
            meta_data={
                "agent_name": agent_name,
                "agent_type": "multi"
            }
        )

        return {"message": "Multi-agent deleted successfully"}

    except Exception as e:
        db.rollback()
        print("🔥 FINAL DELETE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
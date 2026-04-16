from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.models.workflow import Workflow
from app.models.multi_agent import MultiAgent
from app.schemas.workflow import WorkflowCreate, WorkflowResponse  # ✅ import schema

from app.middleware.auth_middleware import (
    get_current_tenant,
    TenantContext,
    require_permission,
    AuthContext,
)

from app.services.audit_service import AuditService

router = APIRouter(prefix="/workflow", tags=["Workflow"])


# ===============================
# SAVE WORKFLOW
# ===============================
@router.post("/{multi_agent_id}")
def save_workflow(
    multi_agent_id: str,
    payload: WorkflowCreate,              # ✅ dict ki jagah Pydantic model
    auth: AuthContext = Depends(require_permission("workflow.create")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Create or update workflow for a multi-agent"""

    try:
        agent_uuid = UUID(multi_agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid multi-agent ID",
        )

    # ---------------------------------------
    # Verify multi-agent belongs to tenant
    # ---------------------------------------
    multi_agent = (
        db.query(MultiAgent)
        .filter(
            MultiAgent.id == agent_uuid,
            MultiAgent.tenant_id == tenant.tenant_id,
        )
        .first()
    )

    if not multi_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found",
        )

    # ✅ Directly use payload.workflow_json — already validated by Pydantic
    workflow_json = payload.workflow_json

    # Check existing workflow
    # ---------------------------------------
    workflow = (
        db.query(Workflow)
        .filter(Workflow.multi_agent_id == agent_uuid)
        .order_by(Workflow.created_at.desc())
        .first()
    )

    if workflow:
        workflow.workflow_json = workflow_json
        action = "workflow_updated"
    else:
        workflow = Workflow(
            multi_agent_id=agent_uuid,
            workflow_json=workflow_json,
        )
        db.add(workflow)
        action = "workflow_created"

    db.commit()
    db.refresh(workflow)

    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action=action,
        resource="workflow",
        resource_id=workflow.id,
        meta_data={"multi_agent_id": multi_agent_id},
    )

    return {
        "message": "Workflow saved successfully",
        "workflow_id": str(workflow.id),
        "name": workflow.name,
        "description": workflow.description,
        "workflow_json": workflow.workflow_json,
    }


# ===============================
# LOAD WORKFLOW
# ===============================
@router.get("/{multi_agent_id}")
def get_workflow(
    multi_agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Fetch workflow configuration for a multi-agent"""

    try:
        agent_uuid = UUID(multi_agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid multi-agent ID",
        )

    multi_agent = (
        db.query(MultiAgent)
        .filter(
            MultiAgent.id == agent_uuid,
            MultiAgent.tenant_id == tenant.tenant_id,
        )
        .first()
    )

    if not multi_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found",
        )

    workflow = (
        db.query(Workflow)
        .filter(Workflow.multi_agent_id == agent_uuid)
        .order_by(Workflow.created_at.desc())
        .first()
    )

    if not workflow:
        # ✅ Empty workflow — frontend will show default start node
        return {
            "workflow_json": {"nodes": [], "edges": []},
        }

    workflow_json = workflow.workflow_json or {}

    return {
        "workflow_id": str(workflow.id),
        "workflow_json": workflow.workflow_json,
    }
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.models.agent_version import AgentVersion
from app.models.multi_agent import MultiAgent
from app.models.workflow import Workflow
from app.schemas.agent_version import (
    AgentVersionCreate,
    AgentVersionResponse,
    AgentVersionListResponse
)
from app.middleware.auth_middleware import (
    get_current_tenant,
    TenantContext,
    require_permission,
    AuthContext
)
from app.services.audit_service import AuditService
from app.utils.versioning import get_next_version

router = APIRouter(
    prefix="/agent-versions",
    tags=["Agent Versions"]
)


# ==========================================
# CREATE NEW VERSION
# ==========================================
@router.post("/{multi_agent_id}", response_model=AgentVersionResponse)
def create_agent_version(
    multi_agent_id: str,
    data: AgentVersionCreate,
    auth: AuthContext = Depends(require_permission("workflow.create")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Create a new version snapshot for a multi-agent.
    If json_spec is not provided, it will auto-build from workflow + agent data.
    """

    try:
        agent_uuid = UUID(multi_agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid multi-agent ID"
        )

    # ---------------------------------------
    # Validate multi-agent belongs to tenant
    # ---------------------------------------
    multi_agent = (
        db.query(MultiAgent)
        .filter(
            MultiAgent.id == agent_uuid,
            MultiAgent.tenant_id == tenant.tenant_id
        )
        .first()
    )

    if not multi_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found"
        )

    # ---------------------------------------
    # Fetch latest existing version
    # ---------------------------------------
    latest_version_row = (
        db.query(AgentVersion)
        .filter(AgentVersion.multi_agent_id == agent_uuid)
        .order_by(AgentVersion.created_at.desc())
        .first()
    )

    latest_version = latest_version_row.version if latest_version_row else None
    new_version = data.version or get_next_version(latest_version)

    # ---------------------------------------
    # Prevent duplicate version
    # ---------------------------------------
    duplicate = (
        db.query(AgentVersion)
        .filter(
            AgentVersion.multi_agent_id == agent_uuid,
            AgentVersion.version == new_version
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Version '{new_version}' already exists for this multi-agent"
        )

    # ---------------------------------------
    # Build json_spec automatically if absent
    # ---------------------------------------
    if data.json_spec:
        json_spec = data.json_spec
    else:
        workflow = (
            db.query(Workflow)
            .filter(Workflow.multi_agent_id == agent_uuid)
            .first()
        )

        workflow_json = workflow.workflow_json if workflow else {"nodes": [], "edges": []}

        json_spec = {
            "multi_agent": {
                "id": str(multi_agent.id),
                "name": getattr(multi_agent, "name", None),
                "description": getattr(multi_agent, "description", None),
            },
            "workflow": workflow_json
        }

    # ---------------------------------------
    # Create version
    # ---------------------------------------
    version = AgentVersion(
        multi_agent_id=agent_uuid,
        version=new_version,
        json_spec=json_spec
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    # ---------------------------------------
    # Audit log
    # ---------------------------------------
    AuditService.log(
        db=db,
        tenant_id=tenant.tenant_id,
        actor_id=auth.user_id,
        action="agent_version_created",
        resource="agent_version",
        resource_id=version.id,
        meta_data={
            "multi_agent_id": str(agent_uuid),
            "version": version.version
        },
    )

    return version


# ==========================================
# GET ALL VERSIONS
# ==========================================
@router.get("/{multi_agent_id}", response_model=AgentVersionListResponse)
def get_agent_versions(
    multi_agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get all versions for a multi-agent.
    """

    try:
        agent_uuid = UUID(multi_agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid multi-agent ID"
        )

    multi_agent = (
        db.query(MultiAgent)
        .filter(
            MultiAgent.id == agent_uuid,
            MultiAgent.tenant_id == tenant.tenant_id
        )
        .first()
    )

    if not multi_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found"
        )

    versions = (
        db.query(AgentVersion)
        .filter(AgentVersion.multi_agent_id == agent_uuid)
        .order_by(AgentVersion.created_at.desc())
        .all()
    )

    return {"versions": versions}


# ==========================================
# GET LATEST VERSION
# ==========================================
@router.get("/{multi_agent_id}/latest", response_model=AgentVersionResponse)
def get_latest_agent_version(
    multi_agent_id: str,
    auth: AuthContext = Depends(require_permission("agents.read")),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get latest version for a multi-agent.
    """

    try:
        agent_uuid = UUID(multi_agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid multi-agent ID"
        )

    multi_agent = (
        db.query(MultiAgent)
        .filter(
            MultiAgent.id == agent_uuid,
            MultiAgent.tenant_id == tenant.tenant_id
        )
        .first()
    )

    if not multi_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-agent not found"
        )

    version = (
        db.query(AgentVersion)
        .filter(AgentVersion.multi_agent_id == agent_uuid)
        .order_by(AgentVersion.created_at.desc())
        .first()
    )

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No versions found for this multi-agent"
        )

    return version
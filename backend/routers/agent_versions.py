from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.agent_version import AgentVersion
from schemas.agent_version import AgentVersionCreate

router = APIRouter(
    prefix="/agent-versions",
    tags=["Agent Versions"]
)


@router.post("/")
def create_agent_version(
    agent_id: str,
    data: AgentVersionCreate,
    db: Session = Depends(get_db)
):

    version = AgentVersion(
        id=data.id,
        agent_id=agent_id,
        version=data.version,
        json_spec=data.json_spec
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    return version

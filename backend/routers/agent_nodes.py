from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from models.agent_node import AgentNode
from schemas.agent_node import AgentNodeCreate

router = APIRouter(
    prefix="/agent-nodes",
    tags=["Agent Nodes"]
)


@router.post("/")
def create_agent_node(
    agent_version_id: str,
    data: AgentNodeCreate,
    db: Session = Depends(get_db)
):

    node = AgentNode(
        id=data.id,
        agent_version_id=agent_version_id,
        type=data.type,
        config=data.config
    )

    db.add(node)
    db.commit()
    db.refresh(node)

    return node

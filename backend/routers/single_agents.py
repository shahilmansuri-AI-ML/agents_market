from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from db.database import get_db
from models.single_agents import SingleAgent
from schemas.single_agents import (
    SingleAgentCreate,
    SingleAgentResponse,
    SingleAgentCreateResponse,
)

router = APIRouter(prefix="/single_agents", tags=["SingleAgents"])


@router.post("/", response_model=SingleAgentCreateResponse)
def create_single_agent(
    payload: SingleAgentCreate,
    db: Session = Depends(get_db)
):
    agent = SingleAgent(
        tenant_id=payload.tenant_id,
        name=payload.name,
        description=payload.description,
        instruction=payload.instruction,
        tool_id=payload.tool_id
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    return {
        "message": "Single agent created successfully",
        "agent": agent
    }


@router.get("/{single_agent_id}", response_model=SingleAgentResponse)
def get_single_agent(
    single_agent_id: UUID,
    db: Session = Depends(get_db)
):
    agent = db.query(SingleAgent).filter(
        SingleAgent.id == single_agent_id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return agent


@router.get("/", response_model=list[SingleAgentResponse])
def list_single_agents(db: Session = Depends(get_db)):
    return db.query(SingleAgent).all()

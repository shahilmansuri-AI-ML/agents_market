from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from db.session import get_db
from models.multi_agents import MultiAgent
from schemas.multi_agents import (
    MultiAgentCreate,
    MultiAgentResponse,
    MultiAgentResponseWithMessage
)

router = APIRouter(prefix="/multi_agents", tags=["MultiAgents"])


@router.post("/", response_model=MultiAgentResponseWithMessage)
def create_agent(agent: MultiAgentCreate, db: Session = Depends(get_db)):

    db_agent = MultiAgent(
        tenant_id=agent.tenant_id,
        name=agent.name,
        status=agent.status,
        tags=agent.tags
    )

    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    return {
        "agent": db_agent,
        "message": "Agent created successfully"
    }


@router.get("/", response_model=list[MultiAgentResponse])
def get_all_agents(db: Session = Depends(get_db)):
    return db.query(MultiAgent).all()


@router.get("/{agent_id}", response_model=MultiAgentResponse)
def get_agent(agent_id: UUID, db: Session = Depends(get_db)):

    agent = db.query(MultiAgent).filter(
        MultiAgent.id == agent_id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return agent


@router.delete("/{agent_id}")
def delete_agent(agent_id: UUID, db: Session = Depends(get_db)):

    agent = db.query(MultiAgent).filter(
        MultiAgent.id == agent_id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    db.delete(agent)
    db.commit()

    return {"message": "Agent deleted"}

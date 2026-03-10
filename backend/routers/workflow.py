import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.workflow import Workflow
from db.session import get_db
from schemas.workflow import WorkflowCreate
from services import workflow_service

router = APIRouter(prefix="/workflow", tags=["Workflow"])

# @router.post("/{multi_agent_id}")
# def save(multi_agent_id: str, data: WorkflowCreate, db: Session = Depends(get_db)):
#     return workflow_service.save_workflow(db, multi_agent_id, data)

@router.post("/{multi_agent_id}")
def save_workflow(
    multi_agent_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):

    workflow = db.query(Workflow).filter(
        Workflow.multi_agent_id == uuid.UUID(multi_agent_id)
    ).first()

    if workflow:
        workflow.nodes = payload["nodes"]
        workflow.edges = payload["edges"]
    else:
        workflow = Workflow(
            multi_agent_id=uuid.UUID(multi_agent_id),
            nodes=payload["nodes"],
            edges=payload["edges"]
        )
        db.add(workflow)

    db.commit()

    return {"message": "Workflow saved"}


@router.get("/{multi_agent_id}")
def get(multi_agent_id: str, db: Session = Depends(get_db)):

    workflow = db.query(Workflow).filter(
        Workflow.multi_agent_id == uuid.UUID(multi_agent_id)
    ).first()

    if not workflow:
        return {"nodes": [], "edges": []}

    return {
        "nodes": workflow.nodes,
        "edges": workflow.edges
    }
# @router.get("/{multi_agent_id}")
# def get(multi_agent_id: str, db: Session = Depends(get_db)):
#     return workflow_service.get_workflow(db, multi_agent_id)
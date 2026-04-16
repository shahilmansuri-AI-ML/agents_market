from models.workflow import Workflow
from sqlalchemy.orm import Session
from models.workflow import Workflow
from schemas.workflow import WorkflowCreate

def save_workflow(db: Session, multi_agent_id, data: WorkflowCreate):

    workflow = db.query(Workflow).filter(
        Workflow.multi_agent_id == multi_agent_id
    ).first()

    if workflow:
        workflow.nodes = data.nodes
        workflow.edges = data.edges

    else:
        workflow = Workflow(
            multi_agent_id=multi_agent_id,
            nodes=data.nodes,
            edges=data.edges
        )

        db.add(workflow)

    db.commit()
    db.refresh(workflow)

    return workflow
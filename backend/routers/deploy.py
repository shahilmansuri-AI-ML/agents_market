from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from models.workflow import Workflow
from models.multi_agents import MultiAgent
import httpx
import os
import logging

router = APIRouter(prefix="/deploy", tags=["Deploy"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WORKFLOW_ENGINE_URL = os.getenv(
    "WORKFLOW_ENGINE_URL",
    "http://pod3_fastapi:8002"
)


@router.post("/agent/{agent_id}")
async def deploy_agent(agent_id: str, db: Session = Depends(get_db)):

    try:

        # Load agent
        agent = db.query(MultiAgent).filter(
            MultiAgent.id == agent_id
        ).first()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Load workflow
        workflow = db.query(Workflow).filter(
            Workflow.multi_agent_id == agent_id
        ).first()

        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        tenant_id = agent.tenant_id

        nodes = workflow.nodes or []
        edges = workflow.edges or []

        steps = [
            {
                "step_id": node.get("id"),
                "step_type": node.get("type", "task"),
                "config": node.get("data", {})
            }
            for node in nodes
        ]

        workflow_definition = {
            "steps": steps,
            "edges": edges
        }

        async with httpx.AsyncClient() as client:

            # Register agent
            register_payload = {
                "agent_id": agent_id,
                "tenant_id": tenant_id,
                "agent_name": agent.name,
                "description": agent.description,
                "system_prompt": getattr(agent, "system_prompt", "You are a helpful assistant."),
                "model_name": getattr(agent, "model_name", "llama3"),
                "execution_framework": getattr(agent, "execution_framework", "ollama"),
                "workflow_definition": workflow_definition
            }

            register_resp = await client.post(
                f"{WORKFLOW_ENGINE_URL}/agents/register",
                json=register_payload
            )

            if register_resp.status_code not in (200, 500):
                raise HTTPException(
                    status_code=502,
                    detail=f"Agent registration failed: {register_resp.text}"
                )

            # Deploy agent
            deploy_resp = await client.post(
                f"{WORKFLOW_ENGINE_URL}/deployments/deploy-agent",
                json={
                    "agent_id": agent_id,
                    "tenant_id": tenant_id
                }
            )

            if deploy_resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Deployment failed: {deploy_resp.text}"
                )

            deployment_result = deploy_resp.json()

        return {
            "status": "deployed",
            "agent_id": agent_id,
            "engine_response": deployment_result
        }

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))
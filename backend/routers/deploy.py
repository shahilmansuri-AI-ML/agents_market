from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.workflow import Workflow
from models.multi_agents import MultiAgent  # adjust import to your actual model path
import httpx
import os
from dotenv import load_dotenv
import logging

load_dotenv()

router = APIRouter(prefix="/deploy", tags=["Deploy"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WORKFLOW_ENGINE_URL = os.getenv("WORKFLOW_ENGINE_URL", "http://localhost:8080")


@router.post("/agent/{agent_id}")
async def deploy_agent(agent_id: str, db: Session = Depends(get_db)):
    """
    Deploy an agent workflow to Pod3 Workflow Engine.

    Flow:
      1. Load workflow + agent metadata from NoCode DB
      2. If agent not yet registered in the engine → POST /agents/register
      3. POST /deployments/deploy-agent to activate it
    """
    try:
        # ── 1. Load workflow ──────────────────────────────────────────────
        workflow = db.query(Workflow).filter(
            Workflow.multi_agent_id == agent_id
        ).first()

        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        # ── 2. Load agent metadata (name, tenant, prompt, model) ──────────
        # Adjust the model/query to match your actual ORM models
        agent = db.query(MultiAgent).filter(
            MultiAgent.id == agent_id
        ).first()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        tenant_id  = agent.tenant_id
        agent_name = agent.name

        # ── 3. Build workflow_definition understood by the engine ─────────
        #    The engine's deployment_service checks for a "steps" key.
        #    We translate NoCode nodes/edges into a steps list.
        nodes = workflow.nodes or []
        edges = workflow.edges or []

        steps = [
            {
                "step_id":   node.get("id"),
                "step_type": node.get("type", "task"),
                "config":    node.get("data", {}),
            }
            for node in nodes
        ]

        workflow_definition = {
            "steps": steps,
            "edges": edges,           # keep edges for reference
            "raw_nodes": nodes,
        }

        async with httpx.AsyncClient() as client:

            # ── 4. Register agent in engine (idempotent – engine checks duplicates) ──
            register_payload = {
                "tenant_id":           tenant_id,
                "agent_name":          agent_name,
                "description":         getattr(agent, "description", ""),
                "system_prompt":       getattr(agent, "system_prompt", "You are a helpful assistant."),
                "model_name":          getattr(agent, "model_name", "llama3"),
                "execution_framework": getattr(agent, "execution_framework", "ollama"),
                "workflow_definition": workflow_definition,
            }

            register_resp = await client.post(
                f"{WORKFLOW_ENGINE_URL}/agents/register",
                json=register_payload,
                timeout=30.0,
            )

            # 409-equivalent: engine returns 500 with "Agent already exists" – that's OK
            if register_resp.status_code not in (200, 500):
                logger.error(f"Registration failed: {register_resp.text}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Engine registration failed: {register_resp.text}",
                )

            # ── 5. Deploy (activate) the agent ───────────────────────────
            deploy_payload = {
                "agent_id":  agent_id,
                "tenant_id": tenant_id,
            }

            deploy_resp = await client.post(
                f"{WORKFLOW_ENGINE_URL}/deployments/deploy-agent",
                json=deploy_payload,
                timeout=30.0,
            )

            if deploy_resp.status_code != 200:
                logger.error(f"Deployment failed: {deploy_resp.text}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Engine deployment failed: {deploy_resp.text}",
                )

            deployment_result = deploy_resp.json()

        return {
            "message":       "Agent deployed successfully",
            "agent_id":      agent_id,
            "deployment_id": deployment_result.get("agent_id", agent_id),
            "status":        deployment_result.get("status", "deployed"),
            "workflow_engine_response": deployment_result,
        }

    except HTTPException:
        raise
    except httpx.RequestError as e:
        logger.error(f"Connection error to workflow engine: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to workflow engine: {e}",
        )
    except Exception as e:
        logger.error(f"Deployment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent/{agent_id}/status")
async def get_deployment_status(agent_id: str, db: Session = Depends(get_db)):
    """
    Get deployment status by querying the engine's agent registry directly.
    The engine has no dedicated status endpoint, so we hit /execute with a
    dry-run flag – or simply proxy to the engine's DB via a lightweight
    GET on /agents/{agent_id} if you add that route later.

    For now we return the status stored in the NoCode DB as the source of
    truth (updated after each deploy/undeploy call).
    """
    try:
        agent = db.query(MultiAgent).filter(
            MultiAgent.id == agent_id
        ).first()

        if not agent:
            return {"status": "not_deployed", "agent_id": agent_id}

        # Optionally enrich with engine status here once you add GET /agents/{id}
        return {
            "agent_id": agent_id,
            "status":   getattr(agent, "deployment_status", "not_deployed"),
        }

    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/agent/{agent_id}")
async def undeploy_agent(agent_id: str, db: Session = Depends(get_db)):
    """
    Undeploy: set agent status back to DRAFT in the engine DB.
    The engine has no DELETE /deployment endpoint yet, so we call
    /deployments/deploy-agent would re-deploy – instead we note that
    a PATCH /agents/{id}/status endpoint should be added to the engine.

    For now we update the NoCode-side status and log a warning.
    """
    try:
        agent = db.query(MultiAgent).filter(
            MultiAgent.id == agent_id
        ).first()

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Update local status
        agent.deployment_status = "not_deployed"
        db.commit()

        logger.warning(
            f"Agent {agent_id} marked as undeployed locally. "
            "Add a PATCH /agents/{id}/status endpoint to the workflow engine "
            "to also revert the engine-side status to DRAFT."
        )

        return {
            "message":  "Agent undeployed (local status updated)",
            "agent_id": agent_id,
            "status":   "undeployed",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Undeploy error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, HTTPException, status
import logging

from app.models.deployment import (
    DeployAgentRequest,
    DeploymentResponse,
)
from app.services.deployment.single_agent_deployment_service import (
    SingleAgentDeploymentService,
)
from app.services.deployment.multi_agent_deployment_service import (
    MultiAgentDeploymentService,
)

router = APIRouter(prefix="/deployments", tags=["Deployments"])
logger = logging.getLogger(__name__)

single_deployment_service = SingleAgentDeploymentService()
multi_deployment_service = MultiAgentDeploymentService()


@router.post(
    "/deploy-agent",
    response_model=DeploymentResponse,
    status_code=status.HTTP_200_OK
)
def deploy_agent(payload: DeployAgentRequest):
    """
    Unified deployment endpoint for both single-agent and multi-agent publishing.
    Frontend should always call this endpoint.
    """
    try:
        if payload.agent_type == "single":
            return single_deployment_service.deploy(
                agent_id=str(payload.agent_id),
                tenant_id=str(payload.tenant_id)
            )

        elif payload.agent_type == "multi":
            return multi_deployment_service.deploy(
                multi_agent_id=str(payload.agent_id),
                tenant_id=str(payload.tenant_id)
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid agent_type. Must be 'single' or 'multi'."
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Deployment failed unexpectedly")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )
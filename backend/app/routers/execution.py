import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.execution import (
    ExecuteDeploymentRequest,
    ExecutionResponse,
    ExecutionStatusResponse,
)
from app.services.execution.execution_service import ExecutionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/executions", tags=["Executions"])
execution_service = ExecutionService()


@router.post(
    "/run",
    response_model=ExecutionResponse,
    status_code=status.HTTP_200_OK,
)
def run_execution(payload: ExecuteDeploymentRequest) -> ExecutionResponse:
    """
    Execute a deployed single-agent or multi-agent workflow.
    """
    try:
        result = execution_service.run(payload)
        return ExecutionResponse(**result)

    except ValueError as e:
        message = str(e)

        if any(
            keyword in message.lower()
            for keyword in [
                "not found",
                "no active deployment",
                "execution not found",
            ]
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    except Exception:
        logger.exception("[API ERROR] Execution failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )


@router.get(
    "/{execution_id}",
    response_model=ExecutionStatusResponse,
    status_code=status.HTTP_200_OK,
)
def get_execution_status(execution_id: str) -> ExecutionStatusResponse:
    """
    Get execution status and output details by execution ID.
    """
    try:
        result = execution_service.get_execution_status(execution_id)
        return ExecutionStatusResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    except Exception:
        logger.exception("[API ERROR] Failed to fetch execution status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )
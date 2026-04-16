import json
import uuid
import logging
from typing import Any, Dict, Optional, Tuple
import time

from app.database.session import SessionLocal
from app.repositories.execution_repository import ExecutionRepository
from app.runtime.coordinator import Coordinator
from app.constants.execution import TriggerType
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)


class ExecutionService:
    """
    execution service for single-agent and multi-agent deployments.
    Responsible for:
    - validating execution input
    - locating active deployments
    - creating execution records
    - triggering runtime execution
    - returning normalized API-safe responses
    """

    def __init__(self) -> None:
        self.repo = ExecutionRepository()
        self.coordinator = Coordinator()
        self.usage_service = UsageService()

    def run(self, payload) -> Dict[str, Any]:
        """
        Run a deployed single-agent or multi-agent execution.
        """
        session = SessionLocal()
        start_time = time.time()
        status_code = 200
        agent_owner_tenant_id = None

        try:
            target_id, tenant_id, agent_type, user_text, triggered_by_user_id = (
                self._extract_payload(payload)
            )

            logger.info(
                "[EXECUTION START] target_id=%s tenant_id=%s agent_type=%s",
                target_id,
                tenant_id,
                agent_type,
            )

            workflow_id = None
            agent_id = None
            deployment = None

            if agent_type == "single":
                deployment = self.repo.get_active_single_deployment(
                    session=session,
                    agent_id=target_id,
                    tenant_id=tenant_id
                )
                
                if not deployment:
                    agent_owner_tenant_id = self.repo.get_agent_owner_tenant(
                        session=session,
                        agent_id=target_id
                    )
                    if agent_owner_tenant_id and agent_owner_tenant_id != tenant_id:
                        deployment = self.repo.get_active_single_deployment(
                            session=session,
                            agent_id=target_id,
                            tenant_id=agent_owner_tenant_id
                        )
                
                agent_id = target_id

            elif agent_type == "multi":
                deployment = self.repo.get_active_multi_deployment(
                    session=session,
                    multi_agent_id=target_id,
                    tenant_id=tenant_id
                )
                
                if not deployment:
                    agent_owner_tenant_id = self.repo.get_multi_agent_owner_tenant(
                        session=session,
                        multi_agent_id=target_id
                    )
                    if agent_owner_tenant_id and agent_owner_tenant_id != tenant_id:
                        deployment = self.repo.get_active_multi_deployment(
                            session=session,
                            multi_agent_id=target_id,
                            tenant_id=agent_owner_tenant_id
                        )
                
                workflow = self.repo.get_workflow(session, target_id)
                workflow_id = str(workflow["id"]) if workflow else None

            else:
                raise ValueError(f"Unsupported agent_type: {agent_type}")

            if not deployment:
                raise ValueError(
                    f"No active deployment found for target_id={target_id}, "
                    f"tenant_id={tenant_id}, agent_type={agent_type}"
                )

            deployment_id = str(deployment["id"])
            snapshot = deployment.get("config_snapshot") or {}

            execution_id = str(uuid.uuid4())

            input_payload = {
                "text": user_text,
                "target_id": target_id,
                "agent_type": agent_type,
            }

            workflow_version = (
                snapshot.get("workflow", {}) if agent_type == "multi" else {}
            )

            self.repo.create_execution(
                session=session,
                execution_id=execution_id,
                tenant_id=tenant_id,
                target_id=target_id,
                target_type=agent_type,
                agent_id=agent_id,
                workflow_id=workflow_id,
                deployment_id=deployment_id,
                trigger_type=TriggerType.MANUAL,
                input_payload=input_payload,
                triggered_by_user_id=triggered_by_user_id,
                workflow_version=workflow_version,
                deployment_snapshot=snapshot,
            )

            session.commit()

            logger.info(
                "[EXECUTION CREATED] execution_id=%s deployment_id=%s",
                execution_id,
                deployment_id,
            )

            result = self.coordinator.execute(execution_id)
            normalized_response = self._extract_response_text(result)

            logger.info(
                "[EXECUTION SUCCESS] execution_id=%s target_id=%s agent_type=%s",
                execution_id,
                target_id,
                agent_type,
            )

            return {
                "status": "success",
                "execution_id": execution_id,
                "target_id": target_id,
                "agent_type": agent_type,
                "deployment_id": deployment_id,
                "response": normalized_response,
                "raw_output": result,
            }

        except Exception as e:
            session.rollback()
            status_code = 500
            logger.exception("[EXECUTION FAILED]")
            raise

        finally:
            # Track usage for cross-tenant public agent calls
            try:
                if agent_owner_tenant_id and str(agent_owner_tenant_id) != tenant_id:
                    # This is a cross-tenant call (consumer using provider's public agent)
                    response_time_ms = int((time.time() - start_time) * 1000)
                    
                    logger.info(
                        f"[USAGE TRACKING] Cross-tenant call: consumer={tenant_id}, "
                        f"provider={agent_owner_tenant_id}, agent={target_id}"
                    )
                    
                    # agent_owner_tenant_id is already a UUID from database
                    # tenant_id and target_id are strings that need conversion
                    self.usage_service.record_call(
                        db=session,
                        consumer_tenant_id=uuid.UUID(tenant_id),
                        owner_tenant_id=agent_owner_tenant_id if isinstance(agent_owner_tenant_id, uuid.UUID) else uuid.UUID(agent_owner_tenant_id),
                        agent_id=uuid.UUID(target_id),
                        api_key_id=None,  # UI-based call, no API key
                        status_code=status_code,
                        latency_ms=response_time_ms
                    )
                    logger.info("[USAGE TRACKING] Successfully logged cross-tenant usage")
            except Exception as log_error:
                # Don't fail the request if logging fails
                logger.error(f"Failed to log usage: {log_error}", exc_info=True)
            finally:
                session.close()

    def get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        """
        Fetch execution status by execution ID.
        """
        session = SessionLocal()

        try:
            execution = self.repo.get_execution_by_id(session, execution_id)

            if not execution:
                raise ValueError("Execution not found")

            return {
                "execution_id": str(execution["execution_id"]),
                "status": execution["status"],
                "deployment_id": (
                    str(execution["deployment_id"])
                    if execution.get("deployment_id")
                    else None
                ),
                "current_step_key": execution.get("current_step_key"),
                "output_payload": execution.get("output_payload"),
                "error_message": execution.get("error_message"),
            }

        except Exception as exc:
            logger.exception(
                "[EXECUTION STATUS FAILED] execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise

        finally:
            session.close()

    # -------------------------------------------------------------------------
    # Internal Helpers
    # -------------------------------------------------------------------------

    def _extract_payload(
        self, payload
    ) -> Tuple[str, str, str, str, Optional[str]]:
        """
        Extract and validate payload fields.
        """
        target_id = str(payload.target_id)
        tenant_id = str(payload.tenant_id)
        agent_type = payload.agent_type
        user_text = payload.text.strip()
        triggered_by_user_id = (
            str(payload.triggered_by_user_id)
            if payload.triggered_by_user_id
            else None
        )

        if not user_text:
            raise ValueError("Execution text cannot be empty")

        if agent_type not in {"single", "multi"}:
            raise ValueError(f"Unsupported agent_type: {agent_type}")

        return target_id, tenant_id, agent_type, user_text, triggered_by_user_id

    def _resolve_deployment(
        self,
        session,
        target_id: str,
        tenant_id: str,
        agent_type: str,
    ) -> Tuple[Optional[dict], Optional[str], Optional[str]]:
        """
        Resolve deployment based on agent type.
        Returns:
            deployment, agent_id, workflow_id
        """
        deployment = None
        agent_id = None
        workflow_id = None

        if agent_type == "single":
            deployment = self.repo.get_active_single_deployment(
                session=session,
                agent_id=target_id,
                tenant_id=tenant_id,
            )
            agent_id = target_id

        elif agent_type == "multi":
            deployment = self.repo.get_active_multi_deployment(
                session=session,
                multi_agent_id=target_id,
                tenant_id=tenant_id,
            )
            workflow = self.repo.get_workflow(session, target_id)
            workflow_id = str(workflow["id"]) if workflow else None

        return deployment, agent_id, workflow_id

    def _extract_response_text(self, result: Any) -> str:
        """
        Safely extract user-facing response text from runtime result.
        """
        if result is None:
            return "Execution completed with no output."

        if isinstance(result, str):
            return result

        if isinstance(result, dict):
            for key in ["text", "response", "output", "message"]:
                value = result.get(key)
                if value:
                    return str(value)

            final_output = result.get("final_output")
            if final_output:
                if isinstance(final_output, str):
                    return final_output

                if isinstance(final_output, dict):
                    for key in ["text", "response", "output", "message"]:
                        value = final_output.get(key)
                        if value:
                            return str(value)

                return self._safe_json_dump(final_output)

            return self._safe_json_dump(result)

        return str(result)

    def _safe_json_dump(self, value: Any) -> str:
        """
        Safely JSON serialize unknown values.
        """
        try:
            return json.dumps(value, default=str, ensure_ascii=False)
        except Exception:
            return str(value)
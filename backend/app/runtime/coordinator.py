import json
import logging
import uuid
from typing import Any, Dict

from app.database.session import SessionLocal
from app.repositories.execution_repository import ExecutionRepository
from app.runtime.lock_manager import LockManager
from app.runtime.state_manager import StateManager
from app.runtime.execution_loader import ExecutionLoader
from app.runtime.step_executor import StepExecutor
from app.runtime.graph_executor import GraphExecutor
from app.runtime.event_manager import EventManager
from app.runtime.errors import RetryableStepError

logger = logging.getLogger(__name__)


class Coordinator:
    """
    runtime orchestrator.

    Responsibilities:
    - Load execution & deployment
    - Acquire/release locks safely
    - Manage execution lifecycle
    - Route execution (single vs multi)
    - Handle retries & failures
    """

    def __init__(self):
        self.lock_manager = LockManager()
        self.state_manager = StateManager()
        self.loader = ExecutionLoader()
        self.repo = ExecutionRepository()
        self.event_manager = EventManager()
        self.step_executor = StepExecutor()
        self.graph_executor = GraphExecutor()

    # =========================================================
    # MAIN EXECUTION ENTRY
    # =========================================================

    def execute(self, execution_id: str) -> Dict[str, Any]:
        session = SessionLocal()
        worker_id = self._generate_worker_id()

        try:
            logger.info("[Coordinator] START execution_id=%s worker_id=%s", execution_id, worker_id)

            execution = self._load_execution(session, execution_id)
            deployment, snapshot, deployment_type = self._load_deployment(session, execution)

            # Acquire lock
            self._acquire_lock(session, execution_id, worker_id)

            # Initialize execution
            self._initialize_execution(session, execution_id, deployment, deployment_type)

            # Route execution
            result = self._route_execution(
                session=session,
                execution_id=execution_id,
                deployment_type=deployment_type,
                snapshot=snapshot,
                input_payload=execution["input_payload"],
            )

            # Finalize success
            self._finalize_success(session, execution_id, result)

            logger.info("[Coordinator] SUCCESS execution_id=%s", execution_id)
            return result

        except RetryableStepError as e:
            logger.warning("[Coordinator] RETRY execution_id=%s error=%s", execution_id, str(e))
            self._handle_retry(session, execution_id, str(e), worker_id)
            return {
                "status": "retry_scheduled",
                "execution_id": execution_id,
                "message": str(e),
            }

        except Exception as e:
            logger.exception("[Coordinator] FAILED execution_id=%s", execution_id)
            self._handle_failure(session, execution_id, str(e), worker_id)
            raise

        finally:
            session.close()

    # =========================================================
    # LOADERS
    # =========================================================

    def _load_execution(self, session, execution_id: str) -> Dict:
        execution = self.loader.load_execution(session, execution_id)
        if not execution:
            raise Exception("Execution not found")

        payload = execution.get("input_payload")
        if isinstance(payload, str):
            execution["input_payload"] = json.loads(payload)

        return execution

    def _load_deployment(self, session, execution: Dict):
        deployment = self.loader.load_deployment(session, execution["deployment_id"])
        if not deployment:
            raise Exception("Deployment not found")

        snapshot = deployment.get("config_snapshot") or {}
        if isinstance(snapshot, str):
            snapshot = json.loads(snapshot)

        deployment_type = snapshot.get("type")
        if not deployment_type:
            raise Exception("Deployment snapshot missing 'type'")

        return deployment, snapshot, deployment_type

    # =========================================================
    # LOCK MANAGEMENT
    # =========================================================

    def _acquire_lock(self, session, execution_id: str, worker_id: str):
        acquired = self.lock_manager.acquire_execution_lock(
            session=session,
            execution_id=execution_id,
            worker_id=worker_id,
        )

        if not acquired:
            raise Exception(f"Execution {execution_id} is already locked")

        self._emit_event(session, execution_id, "LOCK_ACQUIRED", {"worker_id": worker_id})

    def _release_lock_safe(self, session, execution_id: str, worker_id: str):
        try:
            self.lock_manager.release_execution_lock(session, execution_id)
            self._emit_event(session, execution_id, "LOCK_RELEASED", {"worker_id": worker_id})
            session.commit()
        except Exception:
            session.rollback()
            logger.exception("[Coordinator] Failed to release lock")

    # =========================================================
    # EXECUTION LIFECYCLE
    # =========================================================

    def _initialize_execution(self, session, execution_id, deployment, deployment_type):
        self.state_manager.initialize_state(session, execution_id)
        self.repo.mark_running(
            session=session,
            execution_id=execution_id,
            started_at_now=True,
        )

        self._emit_event(
            session,
            execution_id,
            "EXECUTION_STARTED",
            {
                "deployment_id": str(deployment["id"]),
                "deployment_type": deployment_type,
            },
        )

        session.commit()

    def _finalize_success(self, session, execution_id, result):
        self.state_manager.update_state(
            session=session,
            execution_id=execution_id,
            state=result,
            step_key="final_output",
        )

        self._emit_event(session, execution_id, "EXECUTION_COMPLETED", result)

        self.repo.mark_success(
            session=session,
            execution_id=execution_id,
            output_payload=result,
            current_step_key="final_output",
            completed_at_now=True,
        )

        session.commit()

    def _handle_retry(self, session, execution_id, error, worker_id):
        session.rollback()

        self.repo.mark_retry_pending(
            session=session,
            execution_id=execution_id,
            error_message=error,
        )

        self._emit_event(
            session,
            execution_id,
            "EXECUTION_RETRY_PENDING",
            {"retry_pending": True, "error": error},
        )

        self._release_lock_safe(session, execution_id, worker_id)

    def _handle_failure(self, session, execution_id, error, worker_id):
        session.rollback()

        try:
            self._emit_event(
                session,
                execution_id,
                "EXECUTION_FAILED",
                {"error": error},
            )

            self.repo.mark_failed(
                session=session,
                execution_id=execution_id,
                error_message=error,
                completed_at_now=True,
            )

            self._release_lock_safe(session, execution_id, worker_id)

        except Exception:
            session.rollback()
            logger.exception("[Coordinator] Failure cleanup failed")

    # =========================================================
    # EXECUTION ROUTING
    # =========================================================

    def _route_execution(self, session, execution_id, deployment_type, snapshot, input_payload):
        if deployment_type == "single_agent":
            return self._execute_single_agent(session, execution_id, snapshot, input_payload)

        elif deployment_type == "multi_agent":
            return self.graph_executor.execute(
                session=session,
                execution_id=execution_id,
                snapshot=snapshot,
                input_payload=input_payload,
            )

        else:
            raise Exception(f"Unsupported deployment type: {deployment_type}")

    # =========================================================
    # SINGLE AGENT
    # =========================================================

    def _execute_single_agent(self, session, execution_id, snapshot, input_payload):
        agent = snapshot.get("agent") or {}
        tools = snapshot.get("tools") or []
        selected_tool = snapshot.get("selected_tool")

        if not agent:
            raise Exception("Single agent snapshot missing")

        if not selected_tool and tools:
            selected_tool = next(
                (t for t in tools if str(t.get("tool_id")) == str(agent.get("tool_id"))),
                None,
            )

        if selected_tool:
            agent["selected_tool"] = selected_tool

        if snapshot.get("llm_model"):
            agent["llm_model"] = snapshot["llm_model"]

        return self.step_executor.execute(
            session=session,
            execution_id=execution_id,
            agent=agent,
            input_payload=input_payload,
        )

    # =========================================================
    # UTILITIES
    # =========================================================

    def _emit_event(self, session, execution_id, event_type, payload):
        self.event_manager.emit(
            session=session,
            execution_id=execution_id,
            step_execution_id=None,
            event_type=event_type,
            payload=payload,
        )

    def _generate_worker_id(self) -> str:
        return f"worker-{uuid.uuid4()}"
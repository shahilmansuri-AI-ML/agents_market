import json
from typing import Any, Optional
from sqlalchemy import text

from app.constants.execution import ExecutionStatus


class ExecutionRepository:
    """
    Repository for execution/runtime-related DB operations.
    Handles:
    - deployment lookup
    - workflow lookup
    - execution creation
    - execution lifecycle updates
    - execution status retrieval
    """

    # =========================================================
    # DEPLOYMENT LOOKUP
    # =========================================================

    def get_active_single_deployment(self, session, agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    agent_id,
                    multi_agent_id,
                    agent_type,
                    status,
                    config_snapshot,
                    created_at
                FROM deployments
                WHERE agent_id = :agent_id
                  AND tenant_id = :tenant_id
                  AND agent_type = 'single'
                  AND status = 'ACTIVE'
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_active_multi_deployment(self, session, multi_agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    agent_id,
                    multi_agent_id,
                    agent_type,
                    status,
                    config_snapshot,
                    created_at
                FROM deployments
                WHERE multi_agent_id = :multi_agent_id
                  AND tenant_id = :tenant_id
                  AND agent_type = 'multi'
                  AND status = 'ACTIVE'
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_workflow(self, session, multi_agent_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    name,
                    description,
                    workflow_json,
                    created_at,
                    updated_at
                FROM workflows
                WHERE multi_agent_id = :multi_agent_id
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id
            }
        ).mappings().first()

    def get_agent_owner_tenant(self, session, agent_id: str):
        return session.execute(
            text("""
                SELECT tenant_id
                FROM single_agents
                WHERE id = :agent_id
                  AND visibility = 'public'
                LIMIT 1
            """),
            {"agent_id": agent_id}
        ).scalar()

    def get_multi_agent_owner_tenant(self, session, multi_agent_id: str):
        return session.execute(
            text("""
                SELECT tenant_id
                FROM multi_agents
                WHERE id = :multi_agent_id
                  AND visibility = 'public'
                LIMIT 1
            """),
            {"multi_agent_id": multi_agent_id}
        ).scalar()

    # =========================================================
    # EXECUTION CREATION
    # =========================================================

    def create_execution(
        self,
        session,
        execution_id: str,
        tenant_id: str,
        target_id: str,
        target_type: str,
        deployment_id: str,
        trigger_type: str,
        input_payload: dict,
        deployment_snapshot: Optional[dict] = None,
        workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        triggered_by_user_id: Optional[str] = None,
        agent_version_id: Optional[str] = None,
        workflow_version: Optional[dict] = None,
        parent_execution_id: Optional[str] = None
    ) -> None:
        session.execute(
            text("""
                INSERT INTO executions (
                    execution_id,
                    tenant_id,
                    target_id,
                    target_type,
                    workflow_id,
                    agent_id,
                    deployment_id,
                    triggered_by_user_id,
                    agent_version_id,
                    deployment_snapshot,
                    workflow_version,
                    trigger_type,
                    status,
                    parent_execution_id,
                    input_payload,
                    output_payload,
                    error_payload,
                    error_message,
                    current_step_key,
                    created_at,
                    updated_at
                )
                VALUES (
                    :execution_id,
                    :tenant_id,
                    :target_id,
                    :target_type,
                    :workflow_id,
                    :agent_id,
                    :deployment_id,
                    :triggered_by_user_id,
                    :agent_version_id,
                    CAST(:deployment_snapshot AS JSONB),
                    CAST(:workflow_version AS JSONB),
                    :trigger_type,
                    :status,
                    :parent_execution_id,
                    CAST(:input_payload AS JSONB),
                    '{}'::jsonb,
                    '{}'::jsonb,
                    NULL,
                    NULL,
                    NOW(),
                    NOW()
                )
            """),
            {
                "execution_id": execution_id,
                "tenant_id": tenant_id,
                "target_id": target_id,
                "target_type": target_type,
                "workflow_id": workflow_id,
                "agent_id": agent_id,
                "deployment_id": deployment_id,
                "triggered_by_user_id": triggered_by_user_id,
                "agent_version_id": agent_version_id,
                "deployment_snapshot": self._to_json(deployment_snapshot or {}),
                "workflow_version": self._to_json(workflow_version or {}),
                "trigger_type": trigger_type,
                "status": ExecutionStatus.PENDING,
                "parent_execution_id": parent_execution_id,
                "input_payload": self._to_json(input_payload),
            }
        )

    # =========================================================
    # EXECUTION LOOKUP
    # =========================================================

    def get_execution_by_id(self, session, execution_id: str):
        return session.execute(
            text("""
                SELECT
                    execution_id,
                    tenant_id,
                    target_id,
                    target_type,
                    workflow_id,
                    agent_id,
                    deployment_id,
                    status,
                    current_step_key,
                    input_payload,
                    output_payload,
                    error_payload,
                    error_message,
                    deployment_snapshot,
                    workflow_version,
                    trigger_type,
                    parent_execution_id,
                    created_at,
                    updated_at
                FROM executions
                WHERE execution_id = :execution_id
                LIMIT 1
            """),
            {"execution_id": execution_id}
        ).mappings().first()

    # =========================================================
    # EXECUTION LIFECYCLE UPDATES
    # =========================================================

    def mark_running(
        self,
        session,
        execution_id: str,
        current_step_key: Optional[str] = None,
        started_at_now: bool = False,
    ) -> None:
        session.execute(
            text("""
                UPDATE executions
                SET
                    status = :status,
                    current_step_key = :current_step_key,
                    started_at = CASE
                        WHEN :started_at_now THEN COALESCE(started_at, NOW())
                        ELSE started_at
                    END,
                    updated_at = NOW()
                WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "status": ExecutionStatus.RUNNING,
                "current_step_key": current_step_key,
                "started_at_now": started_at_now,
            }
        )

    def update_current_step(
        self,
        session,
        execution_id: str,
        current_step_key: Optional[str]
    ) -> None:
        session.execute(
            text("""
                UPDATE executions
                SET
                    current_step_key = :current_step_key,
                    updated_at = NOW()
                WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "current_step_key": current_step_key,
            }
        )

    def mark_success(
        self,
        session,
        execution_id: str,
        output_payload: Optional[Any] = None,
        current_step_key: Optional[str] = None,
        completed_at_now: bool = False,
    ) -> None:
        session.execute(
            text("""
                UPDATE executions
                SET
                    status = :status,
                    output_payload = CAST(:output_payload AS JSONB),
                    current_step_key = :current_step_key,
                    error_payload = '{}'::jsonb,
                    error_message = NULL,
                    completed_at = CASE
                        WHEN :completed_at_now THEN NOW()
                        ELSE completed_at
                    END,
                    updated_at = NOW()
                WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "status": ExecutionStatus.COMPLETED,
                "output_payload": self._to_json(output_payload or {}),
                "current_step_key": current_step_key,
                "completed_at_now": completed_at_now,
            }
        )

    def mark_failed(
        self,
        session,
        execution_id: str,
        error_message: str,
        error_payload: Optional[Any] = None,
        current_step_key: Optional[str] = None,
        completed_at_now: bool = False,
    ) -> None:
        session.execute(
            text("""
                UPDATE executions
                SET
                    status = :status,
                    error_payload = CAST(:error_payload AS JSONB),
                    error_message = :error_message,
                    current_step_key = :current_step_key,
                    completed_at = CASE
                        WHEN :completed_at_now THEN NOW()
                        ELSE completed_at
                    END,
                    updated_at = NOW()
                WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "status": ExecutionStatus.FAILED,
                "error_payload": self._to_json(error_payload or {}),
                "error_message": error_message,
                "current_step_key": current_step_key,
                "completed_at_now": completed_at_now,
            }
        )

    def mark_retry_pending(
        self,
        session,
        execution_id: str,
        error_message: str,
        current_step_key: Optional[str] = None,
    ) -> None:
        session.execute(
            text("""
                UPDATE executions
                SET
                    status = :status,
                    error_message = :error_message,
                    current_step_key = :current_step_key,
                    updated_at = NOW()
                WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "status": ExecutionStatus.RUNNING,
                "error_message": error_message,
                "current_step_key": current_step_key,
            }
        )

    # =========================================================
    # OPTIONAL: RUNTIME SAFETY / LOCKING
    # =========================================================

    def get_execution_for_update(self, session, execution_id: str):
        return session.execute(
            text("""
                SELECT
                    execution_id,
                    tenant_id,
                    target_id,
                    target_type,
                    workflow_id,
                    agent_id,
                    deployment_id,
                    status,
                    current_step_key,
                    input_payload,
                    output_payload,
                    error_payload,
                    error_message,
                    deployment_snapshot,
                    workflow_version,
                    trigger_type,
                    parent_execution_id,
                    created_at,
                    updated_at
                FROM executions
                WHERE execution_id = :execution_id
                FOR UPDATE
            """),
            {"execution_id": execution_id}
        ).mappings().first()

    # =========================================================
    # INTERNAL UTILS
    # =========================================================

    def _to_json(self, value: Any) -> str:
        return json.dumps(value, default=str, ensure_ascii=False)
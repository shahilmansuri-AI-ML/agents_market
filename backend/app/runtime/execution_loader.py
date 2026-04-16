import logging
import uuid
from typing import Optional, Any

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


class ExecutionLoader:
    """
    loader for runtime execution context.

    Responsibilities:
    - load execution records
    - load deployment records
    - optionally load execution row with DB lock
    - provide runtime-safe DB read helpers
    """

    # =========================================================
    # EXECUTION LOAD
    # =========================================================

    def load_execution(self, session, execution_id: str | uuid.UUID):
        """
        Load execution by execution_id.
        """
        execution_id = str(execution_id)

        try:
            row = session.execute(
                text("""
                    SELECT
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
                        started_at,
                        completed_at,
                        created_at,
                        updated_at
                    FROM executions
                    WHERE execution_id = :execution_id
                    LIMIT 1
                """),
                {"execution_id": execution_id},
            ).mappings().first()

            if row:
                logger.info(
                    "[ExecutionLoader] Loaded execution execution_id=%s status=%s",
                    execution_id,
                    row.get("status"),
                )
            else:
                logger.warning(
                    "[ExecutionLoader] Execution not found execution_id=%s",
                    execution_id,
                )

            return row

        except SQLAlchemyError as exc:
            logger.exception(
                "[ExecutionLoader] Failed to load execution execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise

    # =========================================================
    # EXECUTION LOAD WITH LOCK
    # =========================================================

    def load_execution_for_update(self, session, execution_id: str | uuid.UUID):
        """
        Load execution row with FOR UPDATE lock.
        Useful if runtime needs row-level locking.
        """
        execution_id = str(execution_id)

        try:
            row = session.execute(
                text("""
                    SELECT
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
                        started_at,
                        completed_at,
                        created_at,
                        updated_at
                    FROM executions
                    WHERE execution_id = :execution_id
                    LIMIT 1
                    FOR UPDATE
                """),
                {"execution_id": execution_id},
            ).mappings().first()

            if row:
                logger.info(
                    "[ExecutionLoader] Loaded execution FOR UPDATE execution_id=%s status=%s",
                    execution_id,
                    row.get("status"),
                )
            else:
                logger.warning(
                    "[ExecutionLoader] Execution not found FOR UPDATE execution_id=%s",
                    execution_id,
                )

            return row

        except SQLAlchemyError as exc:
            logger.exception(
                "[ExecutionLoader] Failed to load execution FOR UPDATE execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise

    # =========================================================
    # DEPLOYMENT LOAD
    # =========================================================

    def load_deployment(self, session, deployment_id: str | uuid.UUID):
        """
        Load deployment by deployment_id.
        """
        deployment_id = str(deployment_id)

        try:
            row = session.execute(
                text("""
                    SELECT
                        id,
                        tenant_id,
                        agent_id,
                        multi_agent_id,
                        agent_type,
                        status,
                        config_snapshot,
                        created_at,
                        updated_at
                    FROM deployments
                    WHERE id = :deployment_id
                    LIMIT 1
                """),
                {"deployment_id": deployment_id},
            ).mappings().first()

            if row:
                logger.info(
                    "[ExecutionLoader] Loaded deployment deployment_id=%s status=%s",
                    deployment_id,
                    row.get("status"),
                )
            else:
                logger.warning(
                    "[ExecutionLoader] Deployment not found deployment_id=%s",
                    deployment_id,
                )

            return row

        except SQLAlchemyError as exc:
            logger.exception(
                "[ExecutionLoader] Failed to load deployment deployment_id=%s error=%s",
                deployment_id,
                str(exc),
            )
            raise

    # =========================================================
    # OPTIONAL HELPERS
    # =========================================================

    def load_execution_snapshot(self, session, execution_id: str | uuid.UUID):
        """
        Lightweight execution snapshot loader for monitoring / quick checks.
        """
        execution_id = str(execution_id)

        try:
            row = session.execute(
                text("""
                    SELECT
                        execution_id,
                        status,
                        deployment_id,
                        current_step_key,
                        started_at,
                        completed_at,
                        updated_at
                    FROM executions
                    WHERE execution_id = :execution_id
                    LIMIT 1
                """),
                {"execution_id": execution_id},
            ).mappings().first()

            return row

        except SQLAlchemyError as exc:
            logger.exception(
                "[ExecutionLoader] Failed to load execution snapshot execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise
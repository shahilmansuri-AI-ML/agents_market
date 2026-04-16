from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from sqlalchemy import text


logger = logging.getLogger(__name__)


class StepLifecycleManager:
    """
    Production-grade manager for workflow step lifecycle persistence.

    Responsibilities:
    - Create execution step records
    - Mark steps as completed / failed / retrying
    - Normalize node metadata
    - Safely serialize payloads
    - Keep step tracking consistent for workflow observability
    """

    MAX_RETRY_DELAY_SECONDS = 900  # 15 minutes
    BASE_RETRY_DELAY_SECONDS = 60  # 1 minute

    # =========================================================
    # SQL QUERIES
    # =========================================================
    CREATE_STEP_SQL = text("""
        INSERT INTO execution_steps (
            execution_id,
            step_name,
            step_key,
            step_order,
            step_type,
            status,
            node_id,
            node_type,
            input_payload,
            created_at,
            started_at,
            updated_at
        )
        VALUES (
            :execution_id,
            :step_name,
            :step_key,
            :step_order,
            :step_type,
            'RUNNING',
            :node_id,
            :node_type,
            CAST(:input_payload AS JSONB),
            NOW(), NOW(), NOW()
        )
        RETURNING step_execution_id
    """)

    COMPLETE_STEP_SQL = text("""
        UPDATE execution_steps
        SET status = 'COMPLETED',
            output_payload = CAST(:output AS JSONB),
            completed_at = NOW(),
            updated_at = NOW()
        WHERE step_execution_id = :id
    """)

    FAIL_STEP_SQL = text("""
        UPDATE execution_steps
        SET status = 'FAILED',
            error_message = :error,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE step_execution_id = :id
    """)

    RETRY_STEP_SQL = text("""
        UPDATE execution_steps
        SET status = 'RETRYING',
            error_message = :error,
            retry_count = COALESCE(retry_count, 0) + 1,
            next_retry_at = :next_retry_at,
            completed_at = NULL,
            updated_at = NOW()
        WHERE step_execution_id = :id
    """)

    # =========================================================
    # CREATE STEP
    # =========================================================
    def create_step(
        self,
        session,
        execution_id: str,
        node: Dict[str, Any],
        step_order: int,
        input_payload: Any,
    ):
        """
        Create a new workflow execution step record.
        """
        self._validate_create_step_inputs(execution_id, node, step_order)

        node_type = self._node_type(node)
        step_name = self._resolve_step_name(node)
        step_key = self._build_step_key(node, step_order)

        logger.info(
            "[StepLifecycleManager] CREATE_STEP execution_id=%s node_id=%s node_type=%s step_order=%s",
            execution_id,
            node.get("id"),
            node_type,
            step_order,
        )

        result = session.execute(
            self.CREATE_STEP_SQL,
            {
                "execution_id": execution_id,
                "step_name": step_name,
                "step_key": step_key,
                "step_order": step_order,
                "step_type": node_type.lower(),
                "node_id": str(node["id"]),
                "node_type": node_type,
                "input_payload": self._safe_json_dumps(input_payload),
            },
        )

        step_execution_id = result.scalar()

        logger.info(
            "[StepLifecycleManager] STEP_CREATED step_execution_id=%s",
            step_execution_id,
        )

        return step_execution_id

    # =========================================================
    # COMPLETE STEP
    # =========================================================
    def complete_step(self, session, step_execution_id: Any, output: Any) -> None:
        """
        Mark step as completed.
        """
        self._validate_step_execution_id(step_execution_id)

        logger.info(
            "[StepLifecycleManager] COMPLETE_STEP step_execution_id=%s",
            step_execution_id,
        )

        session.execute(
            self.COMPLETE_STEP_SQL,
            {
                "id": step_execution_id,
                "output": self._safe_json_dumps(output),
            },
        )

    # =========================================================
    # FAIL STEP
    # =========================================================
    def fail_step(self, session, step_execution_id: Any, error: Any) -> None:
        """
        Mark step as failed.
        """
        self._validate_step_execution_id(step_execution_id)

        logger.warning(
            "[StepLifecycleManager] FAIL_STEP step_execution_id=%s error=%s",
            step_execution_id,
            str(error),
        )

        session.execute(
            self.FAIL_STEP_SQL,
            {
                "id": step_execution_id,
                "error": str(error),
            },
        )

    # =========================================================
    # RETRY STEP
    # =========================================================
    def schedule_retry(
        self,
        session,
        step_execution_id: Any,
        error: Any,
        retry_count: int = 0,
    ) -> None:
        """
        Mark step for retry using exponential backoff.
        """
        self._validate_step_execution_id(step_execution_id)

        delay_seconds = self._calculate_retry_delay(retry_count)
        next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)

        logger.warning(
            "[StepLifecycleManager] RETRY_STEP step_execution_id=%s retry_count=%s next_retry_at=%s error=%s",
            step_execution_id,
            retry_count,
            next_retry_at.isoformat(),
            str(error),
        )

        session.execute(
            self.RETRY_STEP_SQL,
            {
                "id": step_execution_id,
                "error": str(error),
                "next_retry_at": next_retry_at,
            },
        )

    # =========================================================
    # HELPERS
    # =========================================================

    def _resolve_step_name(self, node: Dict[str, Any]) -> str:
        """
        Resolve a stable step name from node metadata.
        """
        node_data = node.get("data") if isinstance(node.get("data"), dict) else {}

        return str(
            node.get("name")
            or node_data.get("label")
            or node.get("type")
            or "Unnamed Step"
        ).strip()

    def _build_step_key(self, node: Dict[str, Any], step_order: int) -> str:
        """
        Build unique step key.
        """
        return f"{node['id']}_{step_order}"

    def _safe_json_dumps(self, payload: Any) -> str:
        """
        Safe JSON serializer for DB persistence.
        """
        try:
            return json.dumps(payload, default=str)
        except Exception:
            logger.exception("[StepLifecycleManager] JSON serialization failed")
            return json.dumps({"fallback": str(payload)})

    def _calculate_retry_delay(self, retry_count: int) -> int:
        """
        Exponential backoff with cap.
        """
        safe_retry_count = max(int(retry_count or 0), 0)
        return min(
            self.BASE_RETRY_DELAY_SECONDS * (2 ** safe_retry_count),
            self.MAX_RETRY_DELAY_SECONDS,
        )

    def _validate_create_step_inputs(
        self,
        execution_id: str,
        node: Dict[str, Any],
        step_order: int,
    ) -> None:
        if not execution_id:
            raise ValueError("execution_id is required")

        if not isinstance(node, dict):
            raise ValueError("node must be a dictionary")

        if node.get("id") is None:
            raise ValueError("node.id is required")

        if step_order is None or int(step_order) < 0:
            raise ValueError("step_order must be a non-negative integer")

    def _validate_step_execution_id(self, step_execution_id: Any) -> None:
        if step_execution_id is None or str(step_execution_id).strip() == "":
            raise ValueError("step_execution_id is required")

    # =========================================================
    # NODE TYPE NORMALIZATION
    # =========================================================
    def _node_type(self, node: Dict[str, Any]) -> str:
        """
        Normalize node type into workflow runtime categories.
        """
        raw_type = node.get("node_type") or node.get("type") or ""
        normalized = str(raw_type).strip().upper()

        mapping = {
            "STARTNODE": "INPUT",
            "INPUT": "INPUT",
            "ENDNODE": "OUTPUT",
            "OUTPUT": "OUTPUT",
            "AGENTNODE": "LLM",
            "LLM": "LLM",
            "APINODE": "TOOL",
            "TOOLNODE": "TOOL",
            "TOOL": "TOOL",
            "IFELSENODE": "CONDITION",
            "CONDITION": "CONDITION",
            "LOOPNODE": "CONDITION",
            "APPROVALNODE": "CONDITION",
            "OPENAINODE": "TOOL",
            "CUSTOMNODE": "TOOL",
        }

        return mapping.get(normalized, normalized or "LLM")
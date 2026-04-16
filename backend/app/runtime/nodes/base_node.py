from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.runtime.errors import NonRetryableStepError


logger = logging.getLogger(__name__)


class BaseNodeExecutor(ABC):
    """
    Base contract for all workflow node executors.

    Responsibilities:
    - enforce execute() contract
    - provide shared validation helpers
    - provide safe payload normalization helpers
    - keep executor implementations consistent across runtime

    Expected context:
        {
            "session": db_session,
            "execution_id": "...",
            "node": {...},
            "input": {...},   # or input payload from previous node
            ...
        }
    """

    # =========================================================
    # REQUIRED CONTRACT
    # =========================================================
    @abstractmethod
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute node logic and return standardized output.

        Must be implemented by subclasses.
        """
        raise NotImplementedError(
            f"{self.__class__.__name__}.execute() must be implemented"
        )

    # =========================================================
    # SHARED VALIDATION
    # =========================================================
    def validate_context(
        self,
        context: Dict[str, Any],
        *,
        require_node: bool = True,
        require_execution_id: bool = False,
    ) -> None:
        """
        Validate standard executor context.
        """
        if not isinstance(context, dict):
            raise NonRetryableStepError(
                "Executor context must be a dictionary",
                error_type="INVALID_EXECUTOR_CONTEXT",
            )

        if require_node and "node" not in context:
            raise NonRetryableStepError(
                "Executor context missing required field: node",
                error_type="MISSING_NODE_CONTEXT",
            )

        if require_execution_id and not context.get("execution_id"):
            raise NonRetryableStepError(
                "Executor context missing required field: execution_id",
                error_type="MISSING_EXECUTION_ID",
            )

    # =========================================================
    # SHARED PAYLOAD HELPERS
    # =========================================================
    def normalize_payload(self, payload: Any) -> Dict[str, Any]:
        """
        Normalize payload into a dictionary format.

        This ensures downstream executors always get a predictable structure.
        """
        if isinstance(payload, dict):
            return payload

        if payload is None:
            return {"text": ""}

        return {"text": str(payload)}

    def extract_text(self, payload: Any) -> str:
        """
        Safely extract text from input payload.
        """
        normalized = self.normalize_payload(payload)

        return str(
            normalized.get("text")
            or normalized.get("response")
            or normalized.get("message")
            or ""
        )

    def safe_dict(self, value: Any) -> Dict[str, Any]:
        """
        Return value if dict, otherwise safe empty dict.
        """
        return value if isinstance(value, dict) else {}

    # =========================================================
    # SHARED RESPONSE BUILDERS
    # =========================================================
    def build_meta(
        self,
        *,
        node: Dict[str, Any],
        node_type: str,
        extra: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """
        Standard meta builder for node responses.
        """
        meta = {
            "node_id": str(node.get("id", "")),
            "node_type": str(node_type).upper(),
        }

        if extra:
            meta.update(extra)

        return meta

    def build_response(
        self,
        *,
        text: str = "",
        node: Dict[str, Any],
        node_type: str,
        extra_meta: Dict[str, Any] | None = None,
        **extra_fields: Any,
    ) -> Dict[str, Any]:
        """
        Standard node response builder.
        """
        response: Dict[str, Any] = {
            "text": text,
            "meta": self.build_meta(
                node=node,
                node_type=node_type,
                extra=extra_meta,
            ),
        }

        response.update(extra_fields)
        return response

    # =========================================================
    # OPTIONAL LOGGING HOOK
    # =========================================================
    def log_start(self, context: Dict[str, Any], node_type: str) -> None:
        """
        Standardized start log helper.
        """
        node = self.safe_dict(context.get("node"))

        logger.info(
            "[%s] START execution_id=%s node_id=%s",
            self.__class__.__name__,
            context.get("execution_id"),
            node.get("id"),
        )

    def log_end(self, context: Dict[str, Any], node_type: str) -> None:
        """
        Standardized end log helper.
        """
        node = self.safe_dict(context.get("node"))

        logger.info(
            "[%s] END execution_id=%s node_id=%s",
            self.__class__.__name__,
            context.get("execution_id"),
            node.get("id"),
        )
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.runtime.nodes.base_node import BaseNodeExecutor


logger = logging.getLogger(__name__)


class ConditionNodeExecutor(BaseNodeExecutor):
    """
    executor for CONDITION nodes.

    Responsibilities:
    - Normalize input payload
    - Resolve decision from config
    - Support future dynamic decision logic
    - Return consistent decision output
    - Ensure workflow never crashes
    """

    DEFAULT_DECISION = "default"

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a CONDITION node.

        Expected context:
        {
            "node": {...},
            "input": {...}
        }
        """
        try:
            self._validate_context(context)

            node = context["node"]
            input_payload = context.get("input", {})

            node_data = self._safe_dict(node.get("data"))
            config = self._safe_dict(node_data.get("config"))

            normalized_payload = self._normalize_payload(input_payload)
            decision = self._resolve_decision(config, normalized_payload)

            logger.info(
                "[ConditionNodeExecutor] DECISION node_id=%s decision=%s",
                node.get("id"),
                decision,
            )

            return self._build_response(
                node=node,
                payload=normalized_payload,
                decision=decision,
            )

        except Exception as error:
            logger.exception(
                "[ConditionNodeExecutor] FAILED node_id=%s error=%s",
                context.get("node", {}).get("id"),
                str(error),
            )

            # Fail-safe fallback (never break workflow)
            return {
                "text": "",
                "decision": self.DEFAULT_DECISION,
                "meta": {
                    "error": str(error),
                    "node_type": "CONDITION",
                },
            }

    # =========================================================
    # HELPERS
    # =========================================================

    def _validate_context(self, context: Dict[str, Any]) -> None:
        if not isinstance(context, dict):
            raise ValueError("ConditionNodeExecutor context must be a dictionary")

        if "node" not in context:
            raise ValueError("ConditionNodeExecutor requires 'node' in context")

    def _safe_dict(self, value: Any) -> Dict[str, Any]:
        return value if isinstance(value, dict) else {}

    def _normalize_payload(self, payload: Any) -> Dict[str, Any]:
        """
        Ensure payload is always a dict with 'text'.
        """
        if isinstance(payload, dict):
            return payload

        if payload is None:
            return {"text": ""}

        return {"text": str(payload)}

    def _resolve_decision(
        self,
        config: Dict[str, Any],
        payload: Dict[str, Any],
    ) -> str:
        """
        Resolve decision from config.

        Current logic (backward compatible):
        - decision
        - default_decision
        - branch
        - fallback → "default"

        Future-ready for dynamic rules.
        """
        decision = (
            config.get("decision")
            or config.get("default_decision")
            or config.get("branch")
        )

        if decision is None:
            return self.DEFAULT_DECISION

        return str(decision).strip().lower()

    # =========================================================
    # RESPONSE
    # =========================================================

    def _build_response(
        self,
        *,
        node: Dict[str, Any],
        payload: Dict[str, Any],
        decision: str,
    ) -> Dict[str, Any]:
        return {
            "text": payload.get("text", ""),
            "decision": decision,
            "meta": {
                "node_id": str(node.get("id", "")),
                "node_type": "CONDITION",
            },
        }
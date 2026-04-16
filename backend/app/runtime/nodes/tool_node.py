from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.runtime.nodes.base_node import BaseNodeExecutor
from app.runtime.tool_runtime_executor import ToolRuntimeExecutor


logger = logging.getLogger(__name__)


class ToolNodeExecutor(BaseNodeExecutor):
    """
    executor for TOOL nodes.

    Responsibilities:
    - Extract tool configuration from node
    - Normalize input payload
    - Execute tool via ToolRuntimeExecutor
    - Return standardized response
    - Handle failures safely (no workflow crash)
    """

    DEFAULT_TOOL_NAME = "Tool"

    def __init__(self) -> None:
        self.executor = ToolRuntimeExecutor()

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a TOOL node.

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

            tool_name = self._resolve_tool_name(node, node_data, config)
            tool_config = self._merge_tool_config(node_data, config)

            input_text = self._extract_text(input_payload)

            logger.info(
                "[ToolNodeExecutor] START node_id=%s tool=%s",
                node.get("id"),
                tool_name,
            )

            # -------------------------------------------------
            # TOOL EXECUTION
            # -------------------------------------------------
            try:
                tool_output = self.executor.execute(tool_config, input_text)

            except Exception as tool_error:
                logger.exception(
                    "[ToolNodeExecutor] TOOL_EXECUTION_FAILED node_id=%s tool=%s error=%s",
                    node.get("id"),
                    tool_name,
                    str(tool_error),
                )

                return self._build_error_response(
                    node=node,
                    tool_name=tool_name,
                    tool_config=tool_config,
                    error=str(tool_error),
                )

            # -------------------------------------------------
            # SUCCESS RESPONSE
            # -------------------------------------------------
            return self._build_success_response(
                node=node,
                tool_name=tool_name,
                tool_config=tool_config,
                output=tool_output,
            )

        except Exception as error:
            logger.exception(
                "[ToolNodeExecutor] UNEXPECTED_ERROR node_id=%s error=%s",
                context.get("node", {}).get("id"),
                str(error),
            )

            return {
                "text": "Tool execution failed due to internal error.",
                "meta": {
                    "error": str(error),
                    "node_type": "TOOL",
                },
            }

    # =========================================================
    # HELPERS
    # =========================================================

    def _validate_context(self, context: Dict[str, Any]) -> None:
        if not isinstance(context, dict):
            raise ValueError("ToolNodeExecutor context must be a dictionary")

        if "node" not in context:
            raise ValueError("ToolNodeExecutor requires 'node' in context")

    def _safe_dict(self, value: Any) -> Dict[str, Any]:
        return value if isinstance(value, dict) else {}

    def _resolve_tool_name(
        self,
        node: Dict[str, Any],
        node_data: Dict[str, Any],
        config: Dict[str, Any],
    ) -> str:
        """
        Resolve tool name from multiple fallback sources.
        """
        return str(
            node_data.get("label")
            or node.get("name")
            or config.get("name")
            or config.get("tool")
            or self.DEFAULT_TOOL_NAME
        ).strip()

    def _merge_tool_config(
        self,
        node_data: Dict[str, Any],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Merge node-level and config-level settings.
        Config overrides node_data.
        """
        return {
            **node_data,
            **config,
        }

    def _extract_text(self, payload: Any) -> str:
        """
        Normalize input payload into text.
        """
        if payload is None:
            return ""

        if isinstance(payload, str):
            return payload

        if isinstance(payload, dict):
            return str(
                payload.get("text")
                or payload.get("response")
                or payload.get("message")
                or ""
            )

        return str(payload)

    # =========================================================
    # RESPONSE BUILDERS
    # =========================================================

    def _build_success_response(
        self,
        *,
        node: Dict[str, Any],
        tool_name: str,
        tool_config: Dict[str, Any],
        output: Any,
    ) -> Dict[str, Any]:
        return {
            "text": str(output),
            "meta": {
                "mock": False,
                "tool_name": tool_name,
                "tool_api": self._extract_tool_api(tool_config),
                "node_id": str(node.get("id", "")),
                "node_type": "TOOL",
            },
        }

    def _build_error_response(
        self,
        *,
        node: Dict[str, Any],
        tool_name: str,
        tool_config: Dict[str, Any],
        error: str,
    ) -> Dict[str, Any]:
        """
        Safe failure response (prevents pipeline crash).
        """
        return {
            "text": f"Tool '{tool_name}' failed to execute.",
            "meta": {
                "error": error,
                "tool_name": tool_name,
                "tool_api": self._extract_tool_api(tool_config),
                "node_id": str(node.get("id", "")),
                "node_type": "TOOL",
                "tool_failed": True,
            },
        }

    def _extract_tool_api(self, tool_config: Dict[str, Any]) -> Optional[str]:
        return (
            tool_config.get("tool_api")
            or tool_config.get("api")
            or tool_config.get("url")
        )
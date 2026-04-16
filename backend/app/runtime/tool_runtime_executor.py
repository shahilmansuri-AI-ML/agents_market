from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from app.runtime.errors import NonRetryableStepError, RetryableStepError


logger = logging.getLogger(__name__)


class ToolRuntimeExecutor:
    """
    Production-grade executor for tool nodes in the multi-agent runtime.

    Responsibilities:
    - validate tool config
    - execute internal tools
    - call external HTTP tools
    - parse tool responses safely
    - raise structured retryable / non-retryable runtime errors
    """

    TOOL_TIMEOUT_SECONDS = 15
    TOOL_QUERY_KEYS = ["message", "query", "q", "text", "prompt"]

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(self, tool_config: Dict[str, Any], input_text: str) -> str:
        """
        Execute tool using config + user input.
        """
        tool_config = self._safe_dict(tool_config)

        tool_api = str(
            tool_config.get("tool_api")
            or tool_config.get("api")
            or tool_config.get("url")
            or ""
        ).strip()

        if not tool_api:
            raise NonRetryableStepError(
                "Tool node is missing tool_api",
                error_type="INVALID_TOOL_CONFIG",
                details={"tool_config": tool_config},
            )

        logger.info(
            "[ToolRuntimeExecutor] START tool_api=%s",
            tool_api,
        )

        if tool_api.startswith("internal://calculator"):
            return self._exec_internal_calculator(input_text)

        return self._call_http_tool(tool_api, input_text)

    # =========================================================
    # HTTP TOOL EXECUTION
    # =========================================================
    def _call_http_tool(self, tool_api: str, input_text: str) -> str:
        """
        Call external HTTP tool with fallback query key variations.
        """
        request_urls = self._build_candidate_urls(tool_api, input_text)
        last_error: Optional[Exception] = None

        for request_url in request_urls:
            try:
                logger.info(
                    "[ToolRuntimeExecutor] HTTP_CALL url=%s",
                    request_url,
                )

                request = Request(
                    request_url,
                    headers={"Accept": "application/json, text/plain, */*"},
                )

                with urlopen(request, timeout=self.TOOL_TIMEOUT_SECONDS) as response:
                    body = response.read().decode("utf-8", errors="ignore")
                    content_type = response.headers.get("Content-Type", "")

                    parsed = self._extract_response(body, content_type)

                    if parsed:
                        logger.info(
                            "[ToolRuntimeExecutor] HTTP_SUCCESS url=%s",
                            request_url,
                        )
                        return parsed

            except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
                last_error = exc
                logger.warning(
                    "[ToolRuntimeExecutor] HTTP_ATTEMPT_FAILED url=%s error=%s",
                    request_url,
                    str(exc),
                )
                continue

        raise RetryableStepError(
            f"Tool request failed: {last_error}" if last_error else "Tool request failed",
            error_type="TOOL_EXECUTION_ERROR",
            details={"tool_api": tool_api},
            cause=last_error,
        )

    def _build_candidate_urls(self, tool_api: str, input_text: str) -> List[str]:
        """
        Build multiple candidate URLs using common query param keys.
        Preserves backward compatibility with existing tools.
        """
        parsed = urlparse(tool_api)
        base_query = dict(parse_qsl(parsed.query, keep_blank_values=True))

        urls: List[str] = []

        for key in self.TOOL_QUERY_KEYS:
            query = {**base_query, key: input_text}
            urls.append(urlunparse(parsed._replace(query=urlencode(query))))

        urls.append(tool_api)  # final raw fallback

        return urls

    # =========================================================
    # RESPONSE PARSING
    # =========================================================
    def _extract_response(self, body: str, content_type: str) -> str:
        """
        Parse HTTP tool response into plain text.
        """
        if not body:
            return ""

        lower_type = (content_type or "").lower()
        if "application/json" in lower_type or body.lstrip().startswith(("{", "[")):
            payload = json.loads(body)
            return self._flatten(payload)

        return body.strip()

    def _flatten(self, payload: Any) -> str:
        """
        Flatten nested tool responses into a meaningful string.
        """
        if payload is None:
            return ""

        if isinstance(payload, str):
            return payload.strip()

        if isinstance(payload, (int, float, bool)):
            return str(payload)

        if isinstance(payload, list):
            for item in payload:
                text = self._flatten(item)
                if text:
                    return text
            return json.dumps(payload, default=str)

        if isinstance(payload, dict):
            for key in [
                "reply",
                "response",
                "result",
                "output",
                "answer",
                "text",
                "message",
                "content",
                "data",
            ]:
                text = self._flatten(payload.get(key))
                if text:
                    return text
            return json.dumps(payload, default=str)

        return str(payload)

    # =========================================================
    # INTERNAL TOOLS
    # =========================================================
    def _exec_internal_calculator(self, input_text: str) -> str:
        """
        Execute a very restricted internal calculator.

        Backward-compatible with current behavior.
        """
        expression = str(input_text or "").replace("^", "**").strip()

        if not expression:
            raise NonRetryableStepError(
                "Calculator expression missing",
                error_type="INVALID_TOOL_INPUT",
            )

        safe = set("0123456789+-*/%(). ")
        if any(ch not in safe for ch in expression):
            raise NonRetryableStepError(
                "Calculator expression contains unsupported characters",
                error_type="INVALID_TOOL_INPUT",
                details={"expression": expression},
            )

        try:
            result = eval(expression, {"__builtins__": {}}, {})
            return str(result)

        except Exception as exc:
            raise NonRetryableStepError(
                f"Calculator execution failed: {exc}",
                error_type="INVALID_TOOL_INPUT",
                details={"expression": expression},
                cause=exc,
            ) from exc

    # =========================================================
    # HELPERS
    # =========================================================
    def _safe_dict(self, value: Any) -> Dict[str, Any]:
        return value if isinstance(value, dict) else {}

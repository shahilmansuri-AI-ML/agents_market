from __future__ import annotations

import json
from typing import Any, Dict, List
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from app.agent_framework.core.models import ToolExecutionContext, ToolResult
from app.agent_framework.tools.base import Tool


class HttpJsonTool(Tool):
    """Generic HTTP GET tool with configurable query mapping and response extraction."""

    def __init__(
        self,
        name: str,
        endpoint: str,
        query_keys: List[str],
        response_fields: List[str],
        timeout_seconds: int = 10,
    ) -> None:
        self.name = name
        self._endpoint = endpoint
        self._query_keys = query_keys
        self._response_fields = response_fields
        self._timeout_seconds = timeout_seconds

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "HttpJsonTool":
        return cls(
            name=str(config["name"]),
            endpoint=str(config["endpoint"]),
            query_keys=list(config.get("query_keys") or ["query"]),
            response_fields=list(config.get("response_fields") or ["result", "text", "message"]),
            timeout_seconds=int(config.get("timeout_seconds", 10)),
        )

    def execute(self, user_input: str, context: ToolExecutionContext) -> ToolResult:
        try:
            urls = self._build_urls(user_input)
            for url in urls:
                request = Request(url, headers={"Accept": "application/json, text/plain, */*"})
                with urlopen(request, timeout=self._timeout_seconds) as response:
                    body = response.read().decode("utf-8", errors="ignore").strip()
                    if not body:
                        continue

                    content = self._extract_content(body)
                    if content:
                        return ToolResult(ok=True, content=content, raw=body)

            return ToolResult(ok=False, content="", error="empty_response")

        except Exception as exc:
            return ToolResult(ok=False, content="", error=str(exc))

    def _build_urls(self, user_input: str) -> List[str]:
        parsed = urlparse(self._endpoint)
        base_query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        urls: List[str] = []

        for key in self._query_keys:
            query = {**base_query, key: user_input}
            urls.append(urlunparse(parsed._replace(query=urlencode(query))))

        urls.append(self._endpoint)
        return urls

    def _extract_content(self, body: str) -> str:
        if not body:
            return ""

        if body.startswith("{") or body.startswith("["):
            payload = json.loads(body)
            return self._flatten(payload)

        return body

    def _flatten(self, value: Any) -> str:
        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, (int, float, bool)):
            return str(value)

        if isinstance(value, list):
            for item in value:
                text = self._flatten(item)
                if text:
                    return text
            return json.dumps(value, default=str)

        if isinstance(value, dict):
            for key in self._response_fields:
                text = self._flatten(value.get(key))
                if text:
                    return text
            return json.dumps(value, default=str)

        return str(value)

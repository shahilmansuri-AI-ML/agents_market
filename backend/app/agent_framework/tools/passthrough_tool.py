from __future__ import annotations

from typing import Any, Dict

from app.agent_framework.core.models import ToolExecutionContext, ToolResult
from app.agent_framework.tools.base import Tool


class PassthroughTool(Tool):
    """Simple tool useful as a fallback or test implementation."""

    def __init__(self, name: str, response_template: str) -> None:
        self.name = name
        self._template = response_template

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "PassthroughTool":
        return cls(
            name=str(config["name"]),
            response_template=str(config.get("response_template", "{input}")),
        )

    def execute(self, user_input: str, context: ToolExecutionContext) -> ToolResult:
        rendered = self._template.replace("{input}", user_input)
        return ToolResult(ok=True, content=rendered)

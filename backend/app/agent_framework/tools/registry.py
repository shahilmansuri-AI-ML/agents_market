from __future__ import annotations

from typing import Dict, Iterable, Optional

from app.agent_framework.tools.base import Tool


class ToolRegistry:
    """Central registry for runtime tool discovery."""

    def __init__(self) -> None:
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def all_names(self) -> Iterable[str]:
        return self._tools.keys()

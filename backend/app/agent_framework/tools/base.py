from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from app.agent_framework.core.models import ToolExecutionContext, ToolResult


class Tool(ABC):
    """Contract for any pluggable tool."""

    name: str

    @abstractmethod
    def execute(self, user_input: str, context: ToolExecutionContext) -> ToolResult:
        """Execute the tool with user input and runtime context."""

    @classmethod
    @abstractmethod
    def from_config(cls, config: Dict[str, Any]) -> "Tool":
        """Create a tool instance from external config."""

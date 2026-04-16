from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass(frozen=True)
class SelectionResult:
    tool_name: Optional[str]
    out_of_scope: bool


class ToolSelector:
    """Maps intent to tool based on runtime config."""

    def __init__(self, intent_to_tool: Dict[str, str], default_tool: Optional[str] = None) -> None:
        self._intent_to_tool = intent_to_tool
        self._default_tool = default_tool

    def select(self, intent_label: str) -> SelectionResult:
        mapped = self._intent_to_tool.get(intent_label)

        if mapped:
            return SelectionResult(tool_name=mapped, out_of_scope=False)

        if self._default_tool:
            return SelectionResult(tool_name=self._default_tool, out_of_scope=False)

        return SelectionResult(tool_name=None, out_of_scope=True)

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class AgentRequest:
    user_id: str
    agent_id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class IntentResult:
    label: str
    confidence: float
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ToolExecutionContext:
    trace_id: str
    agent_id: str
    user_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ToolResult:
    ok: bool
    content: str
    raw: Any = None
    error: Optional[str] = None


@dataclass(frozen=True)
class AgentResponse:
    text: str
    intent: str
    tool_name: Optional[str]
    trace_id: str
    warnings: List[str] = field(default_factory=list)

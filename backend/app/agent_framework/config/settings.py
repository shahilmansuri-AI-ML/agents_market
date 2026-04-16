from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class FrameworkSettings:
    intent_keywords: Dict[str, list[str]]
    intent_tool_map: Dict[str, str]
    default_tool: str | None
    out_of_scope_message: str
    internal_error_message: str
    tools: list[Dict[str, Any]]


DEFAULT_SETTINGS: Dict[str, Any] = {
    "intent_keywords": {},
    "intent_tool_map": {},
    "default_tool": None,
    "out_of_scope_message": "I can't help with this request.",
    "internal_error_message": "I couldn't complete that request right now. Please try again.",
    "tools": [],
}


def load_settings_from_env(env_key: str = "AGENT_FRAMEWORK_CONFIG_JSON") -> FrameworkSettings:
    raw = os.getenv(env_key, "").strip()
    payload = DEFAULT_SETTINGS.copy()

    if raw:
        payload.update(json.loads(raw))

    return FrameworkSettings(
        intent_keywords=dict(payload.get("intent_keywords") or {}),
        intent_tool_map=dict(payload.get("intent_tool_map") or {}),
        default_tool=payload.get("default_tool"),
        out_of_scope_message=str(payload.get("out_of_scope_message") or DEFAULT_SETTINGS["out_of_scope_message"]),
        internal_error_message=str(payload.get("internal_error_message") or DEFAULT_SETTINGS["internal_error_message"]),
        tools=list(payload.get("tools") or []),
    )

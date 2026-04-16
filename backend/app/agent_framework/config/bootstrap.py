from __future__ import annotations

from typing import Dict, Type

from app.agent_framework.config.settings import FrameworkSettings
from app.agent_framework.orchestration.agent_orchestrator import AgentOrchestrator, OrchestratorPolicy
from app.agent_framework.orchestration.intent_classifier import KeywordIntentClassifier
from app.agent_framework.orchestration.tool_selector import ToolSelector
from app.agent_framework.tools.base import Tool
from app.agent_framework.tools.http_json_tool import HttpJsonTool
from app.agent_framework.tools.passthrough_tool import PassthroughTool
from app.agent_framework.tools.registry import ToolRegistry

TOOL_TYPE_MAP: Dict[str, Type[Tool]] = {
    "http_json": HttpJsonTool,
    "passthrough": PassthroughTool,
}


def build_orchestrator(settings: FrameworkSettings) -> AgentOrchestrator:
    registry = ToolRegistry()

    for tool_cfg in settings.tools:
        tool_type = str(tool_cfg.get("type") or "").strip().lower()
        tool_cls = TOOL_TYPE_MAP.get(tool_type)
        if not tool_cls:
            continue
        registry.register(tool_cls.from_config(tool_cfg))

    classifier = KeywordIntentClassifier(
        intent_keywords=settings.intent_keywords,
        default_intent="general",
    )
    selector = ToolSelector(
        intent_to_tool=settings.intent_tool_map,
        default_tool=settings.default_tool,
    )
    policy = OrchestratorPolicy(
        out_of_scope_template=settings.out_of_scope_message,
        internal_error_message=settings.internal_error_message,
    )

    return AgentOrchestrator(
        classifier=classifier,
        selector=selector,
        registry=registry,
        policy=policy,
    )

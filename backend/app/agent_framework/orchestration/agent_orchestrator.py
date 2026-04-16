from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Optional

from app.agent_framework.core.models import AgentRequest, AgentResponse, ToolExecutionContext
from app.agent_framework.orchestration.intent_classifier import IntentClassifier
from app.agent_framework.orchestration.tool_selector import ToolSelector
from app.agent_framework.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OrchestratorPolicy:
    out_of_scope_template: str = "I can't help with this request."
    internal_error_message: str = "I couldn't complete that request right now. Please try again."


class AgentOrchestrator:
    """Coordinates intent classification, tool selection, and tool execution."""

    def __init__(
        self,
        classifier: IntentClassifier,
        selector: ToolSelector,
        registry: ToolRegistry,
        policy: Optional[OrchestratorPolicy] = None,
    ) -> None:
        self._classifier = classifier
        self._selector = selector
        self._registry = registry
        self._policy = policy or OrchestratorPolicy()

    def handle(self, request: AgentRequest) -> AgentResponse:
        trace_id = str(uuid.uuid4())

        try:
            intent = self._classifier.classify(request)
            selection = self._selector.select(intent.label)

            if selection.out_of_scope or not selection.tool_name:
                return AgentResponse(
                    text=self._policy.out_of_scope_template,
                    intent=intent.label,
                    tool_name=None,
                    trace_id=trace_id,
                )

            tool = self._registry.get(selection.tool_name)
            if not tool:
                logger.warning("[AgentOrchestrator] Missing tool mapping tool=%s", selection.tool_name)
                return AgentResponse(
                    text=self._policy.out_of_scope_template,
                    intent=intent.label,
                    tool_name=selection.tool_name,
                    trace_id=trace_id,
                    warnings=["missing_tool_registration"],
                )

            ctx = ToolExecutionContext(
                trace_id=trace_id,
                agent_id=request.agent_id,
                user_id=request.user_id,
                metadata=request.metadata,
            )
            result = tool.execute(request.text, ctx)

            if not result.ok:
                logger.warning("[AgentOrchestrator] Tool execution failed trace_id=%s tool=%s error=%s", trace_id, tool.name, result.error)
                return AgentResponse(
                    text=self._policy.internal_error_message,
                    intent=intent.label,
                    tool_name=tool.name,
                    trace_id=trace_id,
                    warnings=["tool_execution_failed"],
                )

            return AgentResponse(
                text=result.content,
                intent=intent.label,
                tool_name=tool.name,
                trace_id=trace_id,
            )

        except Exception:
            logger.exception("[AgentOrchestrator] Unexpected failure trace_id=%s", trace_id)
            return AgentResponse(
                text=self._policy.internal_error_message,
                intent="unknown",
                tool_name=None,
                trace_id=trace_id,
                warnings=["unexpected_error"],
            )

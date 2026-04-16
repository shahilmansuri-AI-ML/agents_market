from __future__ import annotations

import json
import logging
import os

from app.agent_framework.config.bootstrap import build_orchestrator
from app.agent_framework.config.settings import load_settings_from_env
from app.agent_framework.core.models import AgentRequest

logging.basicConfig(level=logging.INFO)


def main() -> None:
    # Example only: can be replaced by deployment-time env config.
    if not os.getenv("AGENT_FRAMEWORK_CONFIG_JSON"):
        os.environ["AGENT_FRAMEWORK_CONFIG_JSON"] = json.dumps(
            {
                "intent_keywords": {
                    "domain_a": ["topic-a", "keyword-a"],
                    "domain_b": ["topic-b", "keyword-b"],
                },
                "intent_tool_map": {
                    "domain_a": "tool_a",
                    "domain_b": "tool_b",
                },
                "default_tool": None,
                "out_of_scope_message": "I can't help with this. Please ask questions related to supported capabilities.",
                "internal_error_message": "I couldn't process that right now. Please try again.",
                "tools": [
                    {
                        "type": "passthrough",
                        "name": "tool_a",
                        "response_template": "Tool A handled: {input}",
                    },
                    {
                        "type": "passthrough",
                        "name": "tool_b",
                        "response_template": "Tool B handled: {input}",
                    },
                ],
            }
        )

    settings = load_settings_from_env()
    orchestrator = build_orchestrator(settings)

    request = AgentRequest(
        user_id="demo-user",
        agent_id="demo-agent",
        text="sample question",
    )

    response = orchestrator.handle(request)
    print(response)


if __name__ == "__main__":
    main()

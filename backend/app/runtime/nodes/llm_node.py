from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional

from sqlalchemy import text

from app.runtime.nodes.base_node import BaseNodeExecutor
from app.runtime.langchain_llm_executor import LangChainLLMExecutor
from app.runtime.step_executor import StepExecutor


logger = logging.getLogger(__name__)


class LLMNodeExecutor(BaseNodeExecutor):
    """
    executor for LLM workflow nodes.

    Responsibilities:
    - Resolve model/provider configuration
    - Apply guardrails
    - Support passthrough halt behavior
    - Route execution between LangChain and StepExecutor
    - Normalize output shape for downstream workflow execution
    """

    DEFAULT_MODEL = "llama-3.1-8b-instant"
    DEFAULT_PROVIDER = "groq"

    SALES_MARKERS = [
        "sales",
        "revenue",
        "business insight",
        "data processing agent",
    ]

    SALES_KEYWORDS = [
        "sale",
        "sales",
        "revenue",
        "product",
        "units",
        "stock market",
        "market trend",
        "forecast",
        "business",
        "profit",
        "margin",
        "growth",
        "customer",
        "kpi",
    ]

    DATASET_REQUEST_KEYWORDS = [
        "calculate",
        "compute",
        "analyze",
        "summarize",
        "total_units",
        "total revenue",
        "average_revenue_per_product",
        "top_product",
        "clean data",
        "process data",
    ]

    GREETING_PATTERN = re.compile(
        r"^(hi|hello|hey|hii|helo|good morning|good afternoon|good evening|yo)[\s!.?,]*$",
        flags=re.IGNORECASE,
    )

    UUID_PATTERN = re.compile(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}"
    )

    def __init__(self) -> None:
        self.executor = StepExecutor()
        self.langchain_executor = LangChainLLMExecutor()

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an LLM node.

        Expected context:
        {
            "session": db_session,
            "execution_id": "...",
            "agent": {...},
            "input": {...},
            "use_langchain": True/False,
            "runtime_provider": "langgraph"
        }
        """
        self._validate_context(context)

        if not context.get("use_langchain"):
            return self._delegate_step_execution(context)

        session = context.get("session")
        agent = context.get("agent") or {}
        input_payload = context.get("input")
        execution_id = context.get("execution_id")
        runtime_provider = context.get("runtime_provider", "langgraph")

        user_text = self._extract_text(input_payload)

        logger.info(
            "[LLMNodeExecutor] START execution_id=%s agent=%s use_langchain=%s",
            execution_id,
            agent.get("name", "Unknown Agent"),
            True,
        )

        # 1) Halt passthrough
        passthrough_output = self._maybe_passthrough_halted_payload(input_payload)
        if passthrough_output:
            logger.info(
                "[LLMNodeExecutor] PASSTHROUGH execution_id=%s reason=halt_pipeline",
                execution_id,
            )
            return passthrough_output

        # 2) Initial domain guardrail
        guardrail_output = self._apply_initial_sales_guardrail(agent, input_payload, user_text)
        if guardrail_output:
            logger.info(
                "[LLMNodeExecutor] GUARDRail execution_id=%s reason=%s",
                execution_id,
                guardrail_output.get("meta", {}).get("sales_guardrail"),
            )
            return guardrail_output

        # 3) Build prompt safely
        system_prompt = self._build_system_prompt(agent)

        # 4) Resolve model/provider
        model_config = self._resolve_model_config(session, agent)
        provider_name = (model_config.get("provider_name") or self.DEFAULT_PROVIDER).strip().lower()
        resolved_model_name = (
            model_config.get("model_name")
            or agent.get("llm_model")
            or agent.get("llmModel")
            or agent.get("model_name")
            or agent.get("model")
            or self.DEFAULT_MODEL
        )

        logger.info(
            "[LLMNodeExecutor] MODEL_RESOLVED execution_id=%s provider=%s model=%s",
            execution_id,
            provider_name,
            resolved_model_name,
        )

        # 5) Non-Groq provider -> delegate to StepExecutor
        if provider_name != "groq":
            logger.info(
                "[LLMNodeExecutor] DELEGATING execution_id=%s provider=%s via=StepExecutor",
                execution_id,
                provider_name,
            )
            delegated_agent = {
                **agent,
                "instruction": system_prompt,
                "llm_model": model_config,
            }

            return self.executor.execute(
                session=session,
                execution_id=execution_id,
                agent=delegated_agent,
                input_payload=input_payload,
            )

        # 6) Groq path via LangChain executor
        try:
            response_text = self.langchain_executor.execute(
                system_prompt=system_prompt,
                user_text=user_text,
                model_name=resolved_model_name,
            )

            return self._build_success_response(
                text=response_text,
                agent_name=agent.get("name", "Unknown Agent"),
                provider="langchain",
                runtime_provider=runtime_provider,
                model_name=resolved_model_name,
                execution_id=execution_id,
            )

        except Exception as error:
            logger.exception(
                "[LLMNodeExecutor] LANGCHAIN_EXECUTION_FAILED execution_id=%s error=%s",
                execution_id,
                str(error),
            )
            raise

    # =========================================================
    # EXECUTION HELPERS
    # =========================================================

    def _delegate_step_execution(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delegate execution to StepExecutor (legacy/default path).
        """
        logger.info(
            "[LLMNodeExecutor] Delegating to StepExecutor execution_id=%s",
            context.get("execution_id"),
        )
        return self.executor.execute(
            session=context["session"],
            execution_id=context["execution_id"],
            agent=context["agent"],
            input_payload=context["input"],
        )

    def _build_success_response(
        self,
        *,
        text: str,
        agent_name: str,
        provider: str,
        runtime_provider: str,
        model_name: str,
        execution_id: str,
    ) -> Dict[str, Any]:
        return {
            "text": text,
            "agent_name": agent_name,
            "meta": {
                "provider": provider,
                "runtime_provider": runtime_provider,
                "model_name": model_name,
                "execution_id": execution_id,
            },
        }

    def _build_system_prompt(self, agent: Dict[str, Any]) -> str:
        """
        Build safe final system prompt.
        """
        system_prompt = str(
            agent.get("instruction") or "You are a helpful AI assistant."
        ).strip()

        if self._is_sales_scoped_agent(agent):
            system_prompt = self._build_sales_safety_prompt(system_prompt)

        return system_prompt

    # =========================================================
    # MODEL RESOLUTION
    # =========================================================

    def _resolve_model_config(self, session: Any, agent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve model configuration from:
        1. StepExecutor resolver (preferred)
        2. direct dict config
        3. DB lookup if UUID
        4. raw string model fallback
        """
        resolver = getattr(self.executor, "_resolve_model_config", None)
        if callable(resolver):
            try:
                resolved = resolver(session, agent)
                if isinstance(resolved, dict) and resolved:
                    return resolved
            except Exception:
                logger.exception("[LLMNodeExecutor] StepExecutor model resolver failed")

        llm_field = (
            agent.get("llm_model")
            or agent.get("llmModel")
            or agent.get("model_name")
            or agent.get("model")
        )

        if isinstance(llm_field, dict):
            model_name = (
                llm_field.get("model_name")
                or llm_field.get("name")
                or llm_field.get("model")
            )
            model_api = (
                llm_field.get("model_api")
                or llm_field.get("api_key")
                or llm_field.get("api_link")
            )
            provider_name = str(
                llm_field.get("provider_name")
                or llm_field.get("provider")
                or self._infer_provider_name(model_name)
            ).strip().lower()

            return {
                "provider_name": provider_name,
                "model_name": model_name,
                "model_api": model_api,
            }

        if isinstance(llm_field, str) and self._looks_like_uuid(llm_field):
            row = self._lookup_llm_model(session, llm_field)
            if row:
                return row

        model_name = str(llm_field or self.DEFAULT_MODEL).strip()
        return {
            "provider_name": self._infer_provider_name(model_name),
            "model_name": model_name,
        }

    def _lookup_llm_model(self, session: Any, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Resolve model config from DB by UUID.
        """
        if not session or not model_id:
            return None

        try:
            row = session.execute(
                text(
                    """
                    SELECT provider_name, model_name, model_api
                    FROM llm_models
                    WHERE CAST(id AS TEXT) = :model_id
                    LIMIT 1
                    """
                ),
                {"model_id": str(model_id)},
            ).mappings().first()

            if not row:
                return None

            model_name = row.get("model_name")
            provider_name = str(
                row.get("provider_name")
                or self._infer_provider_name(model_name)
            ).strip().lower()

            return {
                "provider_name": provider_name,
                "model_name": model_name,
                "model_api": row.get("model_api"),
            }

        except Exception:
            logger.exception(
                "[LLMNodeExecutor] Failed DB model lookup model_id=%s",
                model_id,
            )
            return None

    def _infer_provider_name(self, model_name: Any) -> str:
        normalized = str(model_name or "").strip().lower()
        if "gemini" in normalized or "google" in normalized:
            return "gemini"
        return "groq"

    def _looks_like_uuid(self, value: Any) -> bool:
        if not value:
            return False
        return bool(self.UUID_PATTERN.fullmatch(str(value).strip()))

    # =========================================================
    # PAYLOAD HELPERS
    # =========================================================

    def _extract_text(self, payload: Any) -> str:
        """
        Normalize user input payload into text.
        """
        if payload is None:
            return ""
        if isinstance(payload, str):
            return payload
        if isinstance(payload, dict):
            return str(
                payload.get("text")
                or payload.get("response")
                or payload.get("message")
                or ""
            )
        return str(payload)

    def _maybe_passthrough_halted_payload(self, input_payload: Any) -> Optional[Dict[str, Any]]:
        """
        If upstream guardrail halted pipeline, preserve and pass forward.
        """
        if not isinstance(input_payload, dict):
            return None

        meta = input_payload.get("meta")
        if not isinstance(meta, dict):
            return None

        if not meta.get("halt_pipeline"):
            return None

        return {
            "text": str(
                input_payload.get("text")
                or input_payload.get("response")
                or input_payload.get("message")
                or ""
            ),
            "agent_name": input_payload.get("agent_name") or "Guardrail",
            "meta": {
                **meta,
                "provider": meta.get("provider") or "guardrail",
                "runtime_provider": meta.get("runtime_provider") or "langgraph",
            },
        }

    # =========================================================
    # SALES GUARDRAIL
    # =========================================================

    def _apply_initial_sales_guardrail(
        self,
        agent: Dict[str, Any],
        input_payload: Any,
        user_text: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Apply first-turn guardrail for sales-scoped agents.
        """
        if not self._is_sales_scoped_agent(agent):
            return None

        if not self._is_initial_user_turn(input_payload):
            return None

        normalized = user_text.strip().lower()

        if self._is_greeting(normalized):
            return self._guardrail_response(
                text="Hello, how can I assist you with sales today?",
                reason="greeting",
            )

        if not self._is_sales_related(normalized):
            return self._guardrail_response(
                text="I can't help with this. Please ask only sales-related questions.",
                reason="out_of_scope",
            )

        if self._needs_sales_dataset(normalized) and not self._contains_sales_data(user_text):
            return self._guardrail_response(
                text="Please share sales data with product, units, and revenue so I can process it.",
                reason="missing_sales_data",
            )

        return None

    def _guardrail_response(self, text: str, reason: str) -> Dict[str, Any]:
        return {
            "text": text,
            "agent_name": "Sales Guardrail",
            "meta": {
                "provider": "guardrail",
                "runtime_provider": "langgraph",
                "sales_guardrail": reason,
                "halt_pipeline": True,
            },
        }

    def _is_initial_user_turn(self, payload: Any) -> bool:
        if not isinstance(payload, dict):
            return False

        return all(key in payload for key in ("text", "target_id", "agent_type"))

    def _is_sales_scoped_agent(self, agent: Dict[str, Any]) -> bool:
        instruction = str(agent.get("instruction") or "").lower()
        name = str(agent.get("name") or "").lower()
        return any(marker in instruction or marker in name for marker in self.SALES_MARKERS)

    def _build_sales_safety_prompt(self, system_prompt: str) -> str:
        safety_rules = (
            "Strict response policy:\n"
            "1. Never invent or assume sales datasets, metrics, records, or external facts.\n"
            "2. If data is missing, clearly ask for sales data with product, units, and revenue.\n"
            "3. Refuse out-of-scope requests unrelated to sales using: "
            "'I can't help with this. Please ask only sales-related questions.'\n"
            "4. Keep responses concise and business-focused."
        )
        return f"{system_prompt.strip()}\n\n{safety_rules}"

    def _is_greeting(self, normalized_text: str) -> bool:
        if not normalized_text:
            return False
        return self.GREETING_PATTERN.match(normalized_text) is not None

    def _is_sales_related(self, normalized_text: str) -> bool:
        return any(keyword in normalized_text for keyword in self.SALES_KEYWORDS)

    def _needs_sales_dataset(self, normalized_text: str) -> bool:
        return any(keyword in normalized_text for keyword in self.DATASET_REQUEST_KEYWORDS)

    def _contains_sales_data(self, raw_text: str) -> bool:
        if not raw_text:
            return False

        lowered = raw_text.lower()
        has_required_fields = (
            "product" in lowered and "units" in lowered and "revenue" in lowered
        )

        csv_like = "," in raw_text and "\n" in raw_text
        json_like = "{" in raw_text and "}" in raw_text

        return has_required_fields and (csv_like or json_like)

    # =========================================================
    # VALIDATION
    # =========================================================

    def _validate_context(self, context: Dict[str, Any]) -> None:
        if not isinstance(context, dict):
            raise ValueError("LLMNodeExecutor context must be a dictionary")

        required_fields = ["session", "execution_id", "agent", "input"]
        missing = [field for field in required_fields if field not in context]

        if missing:
            raise ValueError(
                f"LLMNodeExecutor missing required context fields: {', '.join(missing)}"
            )

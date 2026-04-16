from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from sqlalchemy import text

from app.runtime.errors import RetryableStepError, NonRetryableStepError
from app.runtime.llm_strand import LLMStrand
from app.runtime.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)

ALLOWED_MODELS = [
                "llama-3.1-8b-instant",
                "llama-3.1-70b-versatile",
                "gemma2-9b-it",
                "gpt-4o",
                "gpt-4o-mini",
                "claude-3-5-sonnet-20241022",
                "claude-3-haiku-20240307",
                "deepseek-chat"
            ]


class StepExecutor:
    """
    Executes a single LLM agent step.

    Responsibilities:
    - Normalize input
    - Resolve model/provider config
    - Optionally execute selected tool
    - Execute LLM via LLMStrand
    - Format final response
    - Return normalized runtime output
    """

    DEFAULT_MODEL = {
        "provider_name": "groq",
        "model_name": "llama-3.1-8b-instant",
        "model_api": None,
    }

    TOOL_QUERY_KEYS = ["message", "query", "q", "text"]
    TOOL_TIMEOUT_SECONDS = 10

    def __init__(self) -> None:
        self.formatter = ResponseFormatter()

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(
        self,
        session,
        execution_id: str,
        agent: Dict[str, Any],
        input_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute one agent step.

        Args:
            session: DB session (kept for compatibility / future expansion)
            execution_id: workflow execution ID
            agent: agent config
            input_payload: current step input payload

        Returns:
            dict: normalized execution output
        """
        try:
            self._validate_execute_inputs(execution_id, agent)

            agent_name = str(agent.get("name") or "Unknown Agent").strip()
            system_prompt = str(
                agent.get("instruction") or "You are a helpful AI assistant."
            ).strip()

            selected_tool = agent.get("selected_tool") or self._find_selected_tool(agent)
            model_config = self._resolve_model_config(session, agent)

            system_prompt = self._build_concise_response_prompt(system_prompt, selected_tool)

            model_name = model_config.get("model_name") or self.DEFAULT_MODEL["model_name"]
            provider_name = model_config.get("provider_name") or self.DEFAULT_MODEL["provider_name"]

            logger.info(
                "[StepExecutor] START execution_id=%s agent=%s provider=%s model=%s tool=%s",
                execution_id,
                agent_name,
                provider_name,
                model_name,
                selected_tool.get("tool_name") if isinstance(selected_tool, dict) else None,
            )

            # -------------------------------------------------
            # 1) Input normalization
            # -------------------------------------------------
            raw_user_text = self._extract_text(input_payload)

            if not raw_user_text or not raw_user_text.strip():
                raise NonRetryableStepError(
                    "Empty user input received",
                    error_type="INVALID_INPUT",
                )

            user_text = raw_user_text.strip()

            # -------------------------------------------------
            # 2) Tool execution (optional)
            # -------------------------------------------------
            if selected_tool:
                tool_result = self._try_execute_tool(
                    selected_tool=selected_tool,
                    user_text=user_text,
                    agent_name=agent_name,
                    execution_id=execution_id,
                    model_name=model_name,
                    provider_name=provider_name,
                )
                if tool_result:
                    return tool_result

            # -------------------------------------------------
            # 3) LLM execution
            # -------------------------------------------------
            tool_prompt = self._build_tool_scope_prompt(selected_tool)
            if tool_prompt:
                system_prompt = f"{system_prompt}\n\n{tool_prompt}"

            strand = LLMStrand(model_config)

            try:
                raw_output = strand.execute(system_prompt, user_text)
            except (RetryableStepError, NonRetryableStepError):
                raise
            except Exception as error:
                logger.exception(
                    "[StepExecutor] LLM execution failed execution_id=%s error=%s",
                    execution_id,
                    str(error),
                )
                raise RetryableStepError(
                    f"LLM execution failed: {str(error)}",
                    error_type="LLM_FAILURE",
                )

            output = self.formatter.refine(raw_output)

            return self._build_response(
                text=output,
                agent_name=agent_name,
                model_name=model_name,
                provider_name=provider_name,
                execution_id=execution_id,
            )

        except (RetryableStepError, NonRetryableStepError):
            raise
        except Exception as error:
            logger.exception(
                "[StepExecutor] Unexpected error execution_id=%s error=%s",
                execution_id,
                str(error),
            )
            raise RetryableStepError(
                str(error),
                error_type="UNKNOWN_ERROR",
            )

    # =========================================================
    # TOOL EXECUTION
    # =========================================================

    def _try_execute_tool(
        self,
        *,
        selected_tool: Dict[str, Any],
        user_text: str,
        agent_name: str,
        execution_id: str,
        model_name: str,
        provider_name: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Safely attempt tool execution without breaking the LLM fallback flow.
        """
        try:
            tool_output = self._execute_selected_tool(selected_tool, user_text)

            if tool_output:
                logger.info(
                    "[StepExecutor] TOOL_SUCCESS execution_id=%s tool=%s",
                    execution_id,
                    selected_tool.get("tool_name"),
                )

                return {
                    "text": tool_output,
                    "agent_name": agent_name,
                    "meta": {
                        "model_name": model_name,
                        "provider_name": provider_name,
                        "execution_id": execution_id,
                        "tool_used": True,
                        "tool_name": selected_tool.get("tool_name"),
                        "tool_api": selected_tool.get("tool_api"),
                    },
                }

        except Exception as tool_error:
            logger.warning(
                "[StepExecutor] TOOL_FAILED execution_id=%s tool=%s error=%s",
                execution_id,
                selected_tool.get("tool_name"),
                str(tool_error),
            )

        return None

    def _execute_selected_tool(self, tool: Dict[str, Any], user_text: str) -> str:
        """
        Execute tool by endpoint or internal protocol.
        """
        tool_api = str(tool.get("tool_api") or "").strip()

        if not tool_api:
            raise ValueError("Missing tool_api")

        if tool_api.startswith("internal://calculator"):
            return self._execute_calculator_tool(user_text)

        static_params = self._extract_tool_query_params(tool)
        return self._call_http_tool(tool_api, user_text, static_params)

    def _call_http_tool(self, tool_api: str, user_text: str, static_params: Dict[str, str]) -> str:
        """
        Call external HTTP tool using safe URL variations.
        """
        urls = self._build_tool_request_urls(tool_api, user_text, static_params)
        last_error: Optional[str] = None

        for url in urls:
            try:
                req = Request(url, headers={"Accept": "application/json"})
                with urlopen(req, timeout=self.TOOL_TIMEOUT_SECONDS) as res:
                    body = res.read().decode("utf-8", errors="ignore").strip()

                    if body:
                        return self._extract_tool_response_text(body)

            except Exception as error:
                last_error = str(error)
                continue

        raise ValueError(last_error or "Tool request failed")

    def _build_tool_request_urls(self, tool_api: str, user_text: str, static_params: Dict[str, str]) -> List[str]:
        """
        Build multiple possible query param variants for compatibility.
        """
        parsed = urlparse(tool_api)
        base_query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        merged_base_query = {**base_query, **static_params}
        urls: List[str] = []

        for key in self.TOOL_QUERY_KEYS:
            query = {**merged_base_query, key: user_text}
            urls.append(urlunparse(parsed._replace(query=urlencode(query))))

        urls.append(urlunparse(parsed._replace(query=urlencode(merged_base_query))))
        return urls

    def _extract_tool_response_text(self, body: str) -> str:
        """
        Normalize tool response text and surface upstream API errors clearly.
        """
        if not body:
            return ""

        try:
            payload = json.loads(body)
        except Exception:
            return body

        if isinstance(payload, dict) and payload.get("success") is False:
            error = payload.get("error") or {}
            if isinstance(error, dict):
                message = error.get("info") or error.get("message") or str(error)
                raise ValueError(str(message))
            raise ValueError(str(error) or "Tool API error")

        return self._flatten_tool_payload(payload)

    def _flatten_tool_payload(self, payload: Any) -> str:
        if payload is None:
            return ""

        if isinstance(payload, str):
            return payload.strip()

        if isinstance(payload, (int, float, bool)):
            return str(payload)

        if isinstance(payload, list):
            for item in payload:
                text = self._flatten_tool_payload(item)
                if text:
                    return text
            return json.dumps(payload, default=str)

        if isinstance(payload, dict):
            for key in ["reply", "response", "result", "output", "answer", "text", "message", "content", "data"]:
                text = self._flatten_tool_payload(payload.get(key))
                if text:
                    return text
            return json.dumps(payload, default=str)

        return str(payload)

    def _extract_tool_query_params(self, tool: Dict[str, Any]) -> Dict[str, str]:
        """
        Extract static query params from tool config_json in a generic, config-driven way.

        Supported config_json shapes:
        - {"query_params": {"k": "v"}}
        - {"params": {"k": "v"}}
        - {"auth": {"query_params": {"k": "v"}}}
        """
        config_json = tool.get("config_json")
        config = config_json if isinstance(config_json, dict) else {}

        params: Dict[str, str] = {}

        for key in ["query_params", "params"]:
            candidate = config.get(key)
            if isinstance(candidate, dict):
                params.update(self._normalize_query_param_values(candidate))

        auth = config.get("auth")
        if isinstance(auth, dict):
            auth_params = auth.get("query_params")
            if isinstance(auth_params, dict):
                params.update(self._normalize_query_param_values(auth_params))

        return params

    def _normalize_query_param_values(self, values: Dict[str, Any]) -> Dict[str, str]:
        normalized: Dict[str, str] = {}

        for key, value in values.items():
            resolved = self._resolve_config_value(value)
            if resolved is not None and str(resolved).strip() != "":
                normalized[str(key)] = str(resolved)

        return normalized

    def _resolve_config_value(self, value: Any) -> Optional[str]:
        """
        Resolve plain values and env placeholders.

        Supported placeholders:
        - "env:VAR_NAME"
        - "${VAR_NAME}"
        """
        if value is None:
            return None

        if not isinstance(value, str):
            return str(value)

        raw = value.strip()

        if raw.startswith("env:"):
            env_key = raw[4:].strip()
            return os.getenv(env_key)

        if raw.startswith("${") and raw.endswith("}") and len(raw) > 3:
            env_key = raw[2:-1].strip()
            return os.getenv(env_key)

        return raw

    def _execute_calculator_tool(self, user_text: str) -> str:
        """
        Very limited internal calculator.
        Safe-ish compatibility version to preserve current behavior.
        """
        expr = re.sub(r"[^\d\+\-\*\/\.\(\)]", "", user_text)

        if not expr:
            raise ValueError("Invalid expression")

        try:
            result = eval(expr, {"__builtins__": {}})
        except Exception as error:
            raise ValueError(f"Calculator execution failed: {str(error)}") from error

        return str(result)

    # =========================================================
    # MODEL RESOLUTION
    # =========================================================

    def _resolve_model_config(self, session, agent: Dict[str, Any]) -> Dict[str, Any]:
        MODEL_MAP = {
                "7725c922-42ab-4fa8-a602-6d3289674032": "llama-3.1-8b-instant"
            }
        """
        Resolve model config from agent payload.

        Backward-compatible behavior:
        - direct dict config
        - plain model string
        - fallback default model
        """
        try:
            llm_field = (
                agent.get("llm_model")
                or agent.get("llmModel")
                or agent.get("model_name")
                or agent.get("model")
            )

            if isinstance(llm_field, dict):
                resolved = self._normalize_model_record(llm_field)
                model_name = resolved.get("model_name")

                if model_name not in ALLOWED_MODELS:
                    logger.warning(f"Invalid model '{model_name}' → using default")
                    return self.DEFAULT_MODEL.copy()

                return resolved
                
            
            if llm_field:
                raw_model = str(llm_field).strip()
                model_name = MODEL_MAP.get(raw_model, raw_model)

                if model_name not in ALLOWED_MODELS:
                    logger.warning(f"Invalid model '{model_name}' → using default")
                    return self.DEFAULT_MODEL.copy()

                return {
                    "provider_name": self._infer_provider_name(model_name),
                    "model_name": model_name,
                }

        except Exception:
            logger.exception("[StepExecutor] Model resolution failed")

        return self.DEFAULT_MODEL.copy()

    def _normalize_model_record(self, row: Any) -> Dict[str, Any]:
        """
        Normalize dict-based model config.
        """
        if not row or not isinstance(row, dict):
            return {}

        model_name = row.get("model_name") or row.get("name") or row.get("model")
        provider_name = str(
            row.get("provider_name")
            or row.get("provider")
            or self._infer_provider_name(model_name)
        ).strip().lower()

        return {
            "provider_name": provider_name,
            "model_name": str(model_name).strip() if model_name else None,
            "model_api": row.get("model_api") or row.get("api_key") or row.get("api_link"),
        }

    def _infer_provider_name(self, model_name: str) -> str:
        """
        Infer provider from model name.
        """
        normalized = str(model_name or "").strip().lower()

        if "gemini" in normalized or "google" in normalized:
            return "gemini"

        return "groq"

    # =========================================================
    # AGENT / TOOL HELPERS
    # =========================================================

    def _find_selected_tool(self, agent: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Resolve selected tool from agent.tools + tool_id.
        """
        tools = agent.get("tools") or []
        tool_id = agent.get("tool_id")

        for tool in tools:
            if str(tool.get("tool_id")) == str(tool_id):
                return tool

        return None

    def _derive_tool_scope_label(self, tool_name: Any) -> str:
        """
        Derive a short generic scope label from the selected tool name.
        """
        raw_name = str(tool_name or "").strip().lower()
        cleaned = re.sub(r"\b(tool|api|assistant|agent|service|search)\b", "", raw_name)
        cleaned = re.sub(r"[^a-z0-9\s-]", "", cleaned).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)

        return cleaned or "the selected tool"

    def _build_tool_scope_prompt(self, tool: Optional[Dict[str, Any]]) -> str:
        """
        Build prompt augmentation when a tool is available.
        """
        if not tool:
            return ""

        tool_name = str(tool.get("tool_name") or "selected tool").strip()
        scope_label = self._derive_tool_scope_label(tool_name)

        prompt_lines = [
            f"Tool available: {tool_name}",
            f"Only answer questions related to {scope_label}.",
            f"If the request is unrelated, reply briefly: 'I can't help with this. Please ask only {scope_label} related questions.'",
        ]

        prompt_lines.append(
            "Answer naturally and concisely. Do not describe the tool, endpoint, or implementation unless the user explicitly asks."
        )

        return "\n".join(prompt_lines)

    def _build_concise_response_prompt(self, base_prompt: str, tool: Optional[Dict[str, Any]]) -> str:
        """
        Add a concise-answer policy to single-agent prompts.
        """
        rules = [
            "Answer in one short paragraph or 1-2 sentences unless the user explicitly asks for more.",
            "Return only the final answer.",
            "Use a natural human tone and keep the response directly focused on the user's question.",
            "Do not mention tool internals, API endpoints, JSON, or implementation details.",
            "Do not use markdown bullets, headings, code blocks, or long preambles.",
        ]

        scope_label = self._derive_tool_scope_label((tool or {}).get("tool_name"))
        rules.append(
            f"If the user's question is unrelated to {scope_label}, refuse briefly and say: 'I can't help with this. Please ask only {scope_label} related questions.'"
        )

        concise_prompt = "\n".join(rules)

        if not base_prompt:
            return concise_prompt

        return f"{base_prompt}\n\n{concise_prompt}"

    # =========================================================
    # PAYLOAD HELPERS
    # =========================================================

    def _extract_text(self, payload: Any) -> str:
        """
        Extract text safely from payload.
        """
        if not payload:
            return ""

        if isinstance(payload, str):
            return payload

        if not isinstance(payload, dict):
            return str(payload)

        for key in ["text", "response", "message", "data"]:
            if payload.get(key):
                return str(payload[key])

        return str(payload)

    # =========================================================
    # RESPONSE HELPERS
    # =========================================================

    def _build_response(
        self,
        *,
        text: str,
        agent_name: str,
        model_name: str,
        provider_name: str,
        execution_id: str,
    ) -> Dict[str, Any]:
        """
        Standard success response format.
        """
        return {
            "text": text,
            "agent_name": agent_name,
            "meta": {
                "model_name": model_name,
                "provider_name": provider_name,
                "execution_id": execution_id,
            },
        }

    # =========================================================
    # VALIDATION
    # =========================================================

    def _validate_execute_inputs(
        self,
        execution_id: str,
        agent: Dict[str, Any],
    ) -> None:
        if not execution_id:
            raise ValueError("execution_id is required")

        if not isinstance(agent, dict):
            raise ValueError("agent must be a dictionary")
from __future__ import annotations

import logging
from typing import Any, Tuple

from app.adapters.groq_adapter import GROQ_DEFAULT_MODEL, normalize_model_name
from app.runtime.errors import NonRetryableStepError, RetryableStepError
from app.adapters.provider_router import generate


logger = logging.getLogger(__name__)


class LangChainLLMExecutor:
    """
    Production-grade multi-agent LLM executor backed by LangChain providers.

    Responsibilities:
    - lazy-load LangChain dependencies
    - normalize model name
    - invoke LLM safely
    - retry with fallback model if primary model is unavailable
    - normalize model response content
    - raise structured runtime errors
    """

    DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant."
    DEFAULT_TIMEOUT_SECONDS = 30
    DEFAULT_TEMPERATURE = 0
    DEFAULT_MAX_RETRIES = 2

    # =========================================================
    # DEPENDENCY LOADER
    # =========================================================
    def _load_deps(self):
        """
        Lazy import LangChain dependencies so app boot doesn't fail
        unless this executor is actually used.
        """
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_groq import ChatGroq

            return SystemMessage, HumanMessage, ChatGroq

        except ImportError as exc:
            logger.exception("[LangChainLLMExecutor] Missing LangChain dependencies")
            raise NonRetryableStepError(
                "LangChain dependencies are missing. Install 'langchain', 'langchain-core', and 'langchain-groq'.",
                error_type="LANGCHAIN_NOT_INSTALLED",
            ) from exc

    # =========================================================
    # MAIN EXECUTION
    # =========================================================
    def execute(
        self,
        *,
        system_prompt: str,
        user_text: str,
        model_name: str,
    ) -> str:
        """
        Execute LLM call using LangChain + ProviderRouter fallback.
        """

        if not str(user_text or "").strip():
            raise NonRetryableStepError(
                "Empty user input received for LangChain execution",
                error_type="INVALID_INPUT",
            )

        resolved_model_name = normalize_model_name(model_name)
        final_system_prompt = str(system_prompt or self.DEFAULT_SYSTEM_PROMPT).strip()

        logger.info(
            "[LangChainLLMExecutor] START model=%s",
            resolved_model_name,
        )

        # =========================================================
        # 🔥 NEW: TRY PROVIDER ROUTER FIRST
        # =========================================================
        try:
            logger.info(
                "[LangChainLLMExecutor] Trying ProviderRouter | model=%s",
                resolved_model_name,
            )

            print(">>> LANGCHAIN → PROVIDER ROUTER")

            messages = [
                {"role": "system", "content": final_system_prompt},
                {"role": "user", "content": user_text},
            ]

            return generate(messages, resolved_model_name)

        except Exception as router_exc:
            logger.warning(
                "[LangChainLLMExecutor] ProviderRouter failed, falling back to LangChain | error=%s",
                str(router_exc),
            )

        # =========================================================
        # ✅ ORIGINAL CODE (UNCHANGED)
        # =========================================================
        SystemMessage, HumanMessage, ChatGroq = self._load_deps()

        try:
            response = self._invoke_model(
                ChatGroq=ChatGroq,
                SystemMessage=SystemMessage,
                HumanMessage=HumanMessage,
                model_name=resolved_model_name,
                system_prompt=final_system_prompt,
                user_text=user_text,
            )

            return self._normalize_response_content(response.content)

        except NonRetryableStepError:
            raise

        except Exception as exc:
            if self._is_model_not_found_error(exc):
                fallback_model = normalize_model_name(GROQ_DEFAULT_MODEL)

                if fallback_model != resolved_model_name:
                    logger.warning(
                        "[LangChainLLMExecutor] Model '%s' unavailable, retrying with fallback '%s'",
                        resolved_model_name,
                        fallback_model,
                    )

                    try:
                        response = self._invoke_model(
                            ChatGroq=ChatGroq,
                            SystemMessage=SystemMessage,
                            HumanMessage=HumanMessage,
                            model_name=fallback_model,
                            system_prompt=final_system_prompt,
                            user_text=user_text,
                        )

                        return self._normalize_response_content(response.content)

                    except Exception as fallback_exc:
                        logger.exception(
                            "[LangChainLLMExecutor] Fallback model invocation failed"
                        )
                        raise RetryableStepError(
                            f"LangChain execution failed: {fallback_exc}",
                            error_type="LANGCHAIN_EXECUTION_ERROR",
                            details={
                                "requested_model": resolved_model_name,
                                "fallback_model": fallback_model,
                            },
                            cause=fallback_exc,
                        ) from fallback_exc

            logger.exception("[LangChainLLMExecutor] Primary model invocation failed")
            raise RetryableStepError(
                f"LangChain execution failed: {exc}",
                error_type="LANGCHAIN_EXECUTION_ERROR",
                details={
                    "requested_model": resolved_model_name,
                },
                cause=exc,
            ) from exc

    # =========================================================
    # MODEL INVOCATION
    # =========================================================
    def _invoke_model(
        self,
        *,
        ChatGroq,
        SystemMessage,
        HumanMessage,
        model_name: str,
        system_prompt: str,
        user_text: str,
    ):
        """
        Shared model invocation helper to avoid duplicate logic.
        """
        model = ChatGroq(
            model=model_name,
            temperature=self.DEFAULT_TEMPERATURE,
            timeout=self.DEFAULT_TIMEOUT_SECONDS,
            max_retries=self.DEFAULT_MAX_RETRIES,
        )

        return model.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_text),
            ]
        )

    # =========================================================
    # ERROR HELPERS
    # =========================================================
    def _is_model_not_found_error(self, exc: Exception) -> bool:
        """
        Detect model availability / deprecation failures.
        """
        message = str(exc).lower()

        return (
            "model_not_found" in message
            or "does not exist" in message
            or "unsupported model" in message
            or "model decommissioned" in message
            or "404" in message
        )

    # =========================================================
    # RESPONSE NORMALIZATION
    # =========================================================
    def _normalize_response_content(self, content: Any) -> str:
        """
        Normalize LangChain / provider response content into plain text.
        """
        if content is None:
            return ""

        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            parts: list[str] = []

            for chunk in content:
                if isinstance(chunk, str):
                    parts.append(chunk)

                elif isinstance(chunk, dict):
                    text_part = chunk.get("text")
                    if text_part:
                        parts.append(str(text_part))

                else:
                    parts.append(str(chunk))

            return "\n".join(part for part in parts if part).strip()

        return str(content).strip()

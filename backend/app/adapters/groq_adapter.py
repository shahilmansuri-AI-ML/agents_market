from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from groq import Groq

from app.runtime.errors import RetryableStepError, NonRetryableStepError

load_dotenv()

logger = logging.getLogger(__name__)

# =========================================================
# CONFIG
# =========================================================

GROQ_DEFAULT_MODEL = os.getenv("GROQ_DEFAULT_MODEL", "llama-3.1-8b-instant")

GROQ_DECOMMISSIONED_MODELS = {
    "llama3-8b-8192",
}

MODEL_ALIASES = {
    "gpt-4o": GROQ_DEFAULT_MODEL,
    "gpt-4o (openai)": GROQ_DEFAULT_MODEL,
    "gpt-4o-mini": GROQ_DEFAULT_MODEL,
    "claude 3.5 (anthropic)": GROQ_DEFAULT_MODEL,
    "claude-3-5-sonnet-20241022": GROQ_DEFAULT_MODEL,
    "claude-3-5-sonnet": GROQ_DEFAULT_MODEL,
    "llama 3 (meta)": "llama-3.1-8b-instant",
    "gemini (google)": GROQ_DEFAULT_MODEL,
    "mistral-small-latest": GROQ_DEFAULT_MODEL,
    "mistral": GROQ_DEFAULT_MODEL,
}

RETRYABLE_KEYWORDS = [
    "timeout",
    "rate limit",
    "temporarily unavailable",
    "connection",
    "503",
    "502",
    "429",
    "internal server error",
]

NON_RETRYABLE_KEYWORDS = [
    "invalid api key",
    "authentication",
    "unauthorized",
    "invalid request",
    "bad request",
    "unsupported model",
]

MODEL_UNAVAILABLE_KEYWORDS = [
    "model_decommissioned",
    "model_not_found",
    "does not exist",
]


# =========================================================
# CLIENT
# =========================================================

def get_client() -> Groq:
    """
    Create Groq client using environment API key.
    """
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise NonRetryableStepError(
            "GROQ_API_KEY not set",
            error_type="AUTH_OR_CONFIG_ERROR",
        )

    return Groq(api_key=api_key)


# =========================================================
# MAIN GENERATION
# =========================================================

def generate(messages: List[Dict[str, Any]], model: Optional[str] = None) -> str:
    """
    Execute Groq chat completion.

    Args:
        messages: OpenAI-style message list
        model: optional requested model

    Returns:
        str: model text output
    """
    model_name = normalize_model_name(model or GROQ_DEFAULT_MODEL)

    logger.info("[GroqAdapter] START model=%s", model_name)

    try:
        return _invoke(messages=messages, model_name=model_name)

    except Exception as exc:
        message = str(exc).lower()

        logger.exception("[GroqAdapter] Primary invocation failed: %s", str(exc))

        # -------------------------------------------------
        # Fallback if model unavailable / deprecated
        # -------------------------------------------------
        if _is_model_unavailable_error(exc):
            fallback_model = normalize_model_name(GROQ_DEFAULT_MODEL)

            if fallback_model != model_name:
                logger.warning(
                    "[GroqAdapter] Model '%s' unavailable, retrying with fallback '%s'",
                    model_name,
                    fallback_model,
                )

                try:
                    return _invoke(messages=messages, model_name=fallback_model)

                except Exception as fallback_error:
                    logger.exception(
                        "[GroqAdapter] Fallback model invocation failed"
                    )
                    raise RetryableStepError(
                        str(fallback_error),
                        error_type="LLM_PROVIDER_ERROR",
                        details={
                            "requested_model": model_name,
                            "fallback_model": fallback_model,
                        },
                        cause=fallback_error,
                    ) from fallback_error

        # -------------------------------------------------
        # Retryable provider failures
        # -------------------------------------------------
        if _is_retryable_error(exc):
            raise RetryableStepError(
                str(exc),
                error_type="LLM_PROVIDER_ERROR",
                details={"requested_model": model_name},
                cause=exc,
            ) from exc

        # -------------------------------------------------
        # Non-retryable config/auth/request failures
        # -------------------------------------------------
        if _is_non_retryable_error(exc):
            raise NonRetryableStepError(
                str(exc),
                error_type="AUTH_OR_CONFIG_ERROR",
                details={"requested_model": model_name},
                cause=exc,
            ) from exc

        # -------------------------------------------------
        # Unknown fallback
        # -------------------------------------------------
        raise RetryableStepError(
            str(exc),
            error_type="UNKNOWN_LLM_ERROR",
            details={"requested_model": model_name},
            cause=exc,
        ) from exc


# =========================================================
# INTERNAL INVOCATION
# =========================================================

def _invoke(messages: List[Dict[str, Any]], model_name: str) -> str:
    """
    Internal shared Groq invocation helper.
    """
    client = get_client()

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
    )

    return _extract_response_text(response)


def _extract_response_text(response: Any) -> str:
    """
    Normalize Groq response into plain text.
    """
    try:
        content = response.choices[0].message.content
        return str(content or "").strip()
    except Exception as exc:
        raise RetryableStepError(
            f"Failed to parse Groq response: {exc}",
            error_type="LLM_PROVIDER_ERROR",
            cause=exc,
        ) from exc


# =========================================================
# MODEL NORMALIZATION
# =========================================================

def normalize_model_name(model_name: Optional[str]) -> str:
    """
    Normalize requested model to Groq-compatible model name.
    """
    if not model_name:
        return GROQ_DEFAULT_MODEL

    normalized = str(model_name).strip()
    lowered = normalized.lower()

    alias = MODEL_ALIASES.get(lowered)
    if alias:
        return alias

    if lowered in GROQ_DECOMMISSIONED_MODELS:
        return GROQ_DEFAULT_MODEL

    if lowered.startswith(("gpt-", "claude-", "gemini-", "mistral-")):
        return GROQ_DEFAULT_MODEL

    if any(provider in lowered for provider in ["anthropic", "openai", "google", "mistral"]):
        return GROQ_DEFAULT_MODEL

    return normalized


# =========================================================
# ERROR HELPERS
# =========================================================

def _is_model_unavailable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in MODEL_UNAVAILABLE_KEYWORDS)


def _is_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in RETRYABLE_KEYWORDS)


def _is_non_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in NON_RETRYABLE_KEYWORDS)
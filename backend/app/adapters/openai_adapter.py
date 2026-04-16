from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

from app.runtime.errors import RetryableStepError, NonRetryableStepError

load_dotenv()

logger = logging.getLogger(__name__)

# =========================================================
# CONFIG
# =========================================================

OPENAI_DEFAULT_MODEL = os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o")

RETRYABLE_KEYWORDS = [
    "timeout",
    "rate limit",
    "rate_limit",
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
    "model_not_found",
]

# Lazy client cache
_client = None


# =========================================================
# CLIENT
# =========================================================

def _get_client():
    """
    Lazy-load OpenAI client to avoid startup failure.
    """
    global _client

    if _client:
        return _client

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise NonRetryableStepError(
            "openai package not installed. Run: pip install openai",
            error_type="MISSING_DEPENDENCY",
            cause=exc,
        ) from exc

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise NonRetryableStepError(
            "OPENAI_API_KEY not set in environment",
            error_type="AUTH_OR_CONFIG_ERROR",
        )

    _client = OpenAI(api_key=api_key)
    return _client


# =========================================================
# MAIN GENERATION
# =========================================================

def generate(
    messages: List[Dict[str, Any]],
    model: Optional[str] = None,
) -> str:
    """
    Execute OpenAI chat completion.

    Args:
        messages: OpenAI-style message list
        model: optional model override

    Returns:
        str: model response text
    """
    client = _get_client()
    model_name = _normalize_model_name(model or OPENAI_DEFAULT_MODEL)

    logger.info("[OpenAIAdapter] START model=%s", model_name)

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
        )

        return _extract_response_text(response)

    except Exception as exc:
        logger.exception("[OpenAIAdapter] Invocation failed")

        if _is_retryable_error(exc):
            raise RetryableStepError(
                str(exc),
                error_type="LLM_PROVIDER_ERROR",
                details={"model": model_name},
                cause=exc,
            ) from exc

        if _is_non_retryable_error(exc):
            raise NonRetryableStepError(
                str(exc),
                error_type="AUTH_OR_CONFIG_ERROR",
                details={"model": model_name},
                cause=exc,
            ) from exc

        raise RetryableStepError(
            str(exc),
            error_type="UNKNOWN_LLM_ERROR",
            details={"model": model_name},
            cause=exc,
        ) from exc


# =========================================================
# RESPONSE HANDLING
# =========================================================

def _extract_response_text(response: Any) -> str:
    """
    Normalize OpenAI response safely.
    """
    try:
        content = response.choices[0].message.content
        return str(content or "").strip()

    except Exception as exc:
        raise RetryableStepError(
            f"Failed to parse OpenAI response: {exc}",
            error_type="LLM_PROVIDER_ERROR",
            cause=exc,
        ) from exc


# =========================================================
# MODEL NORMALIZATION
# =========================================================

def _normalize_model_name(model_name: Optional[str]) -> str:
    """
    Normalize model name safely.
    """
    if not model_name:
        return OPENAI_DEFAULT_MODEL

    normalized = str(model_name).strip()

    if not normalized:
        return OPENAI_DEFAULT_MODEL

    return normalized


# =========================================================
# ERROR HELPERS
# =========================================================

def _is_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in RETRYABLE_KEYWORDS)


def _is_non_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in NON_RETRYABLE_KEYWORDS)
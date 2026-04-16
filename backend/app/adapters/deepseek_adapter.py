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

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_DEFAULT_MODEL = os.getenv("DEEPSEEK_DEFAULT_MODEL", "deepseek-chat")

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
    "overloaded",
    "quota",
    "insufficient_quota",
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

LIMIT_HIT_KEYWORDS = [
    "rate limit",
    "rate_limit",
    "429",
    "quota exceeded",
    "insufficient_quota",
    "too many requests",
    "daily limit",
    "monthly limit",
    "limit reached",
    "exceeded",
]

# Lazy client cache
_client = None


# =========================================================
# CLIENT
# =========================================================

def _get_client():
    """
    Lazy-load OpenAI-compatible client for DeepSeek.
    DeepSeek uses an OpenAI-compatible API.
    """
    global _client

    if _client:
        return _client

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise NonRetryableStepError(
            "openai package not installed (required for DeepSeek). Run: pip install openai",
            error_type="MISSING_DEPENDENCY",
            cause=exc,
        ) from exc

    api_key = DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise NonRetryableStepError(
            "DEEPSEEK_API_KEY not set in environment",
            error_type="AUTH_OR_CONFIG_ERROR",
        )

    _client = OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)
    return _client


# =========================================================
# MAIN GENERATION
# =========================================================

def generate(messages: List[Dict[str, Any]], model: Optional[str] = None) -> str:
    """
    Execute DeepSeek chat completion.

    Args:
        messages: OpenAI-style message list
        model: optional requested model (defaults to deepseek-chat)

    Returns:
        str: model text output

    Raises:
        RetryableStepError: for transient / rate-limit failures
        NonRetryableStepError: for auth / config failures
    """
    model_name = model or DEEPSEEK_DEFAULT_MODEL

    logger.info("[DeepSeekAdapter] START model=%s", model_name)

    try:
        return _invoke(messages=messages, model_name=model_name)

    except Exception as exc:
        message = str(exc).lower()
        logger.exception("[DeepSeekAdapter] Invocation failed: %s", str(exc))

        if _is_limit_hit_error(exc):
            raise RetryableStepError(
                str(exc),
                error_type="DEEPSEEK_LIMIT_HIT",
                details={"model": model_name, "reason": "rate_limit_or_quota"},
                cause=exc,
            ) from exc

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
# INTERNAL INVOCATION
# =========================================================

def _invoke(messages: List[Dict[str, Any]], model_name: str) -> str:
    """
    Internal DeepSeek invocation using OpenAI-compatible client.
    """
    client = _get_client()

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
    )

    return _extract_response_text(response)


def _extract_response_text(response: Any) -> str:
    """
    Normalize DeepSeek response into plain text.
    """
    try:
        content = response.choices[0].message.content
        return str(content or "").strip()
    except Exception as exc:
        raise RetryableStepError(
            f"Failed to parse DeepSeek response: {exc}",
            error_type="LLM_PROVIDER_ERROR",
            cause=exc,
        ) from exc


# =========================================================
# ERROR HELPERS
# =========================================================

def _is_limit_hit_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in LIMIT_HIT_KEYWORDS)


def _is_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in RETRYABLE_KEYWORDS)


def _is_non_retryable_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(keyword in message for keyword in NON_RETRYABLE_KEYWORDS)


def is_available() -> bool:
    """Check if DeepSeek is configured and available."""
    return bool(DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY"))
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv

from app.runtime.errors import RetryableStepError, NonRetryableStepError

load_dotenv()

logger = logging.getLogger(__name__)

# =========================================================
# CONFIG
# =========================================================

ANTHROPIC_DEFAULT_MODEL = os.getenv(
    "ANTHROPIC_DEFAULT_MODEL",
    "claude-3-5-sonnet-20241022",
)

RETRYABLE_KEYWORDS = [
    "timeout",
    "rate limit",
    "overloaded",
    "temporarily unavailable",
    "503",
    "502",
    "429",
    "internal server error",
]

NON_RETRYABLE_KEYWORDS = [
    "api key",
    "authentication",
    "unauthorized",
    "invalid request",
    "bad request",
    "not found",
]

# Lazy client cache
_client = None


# =========================================================
# CLIENT
# =========================================================

def _get_client():
    """
    Lazy-load Anthropic client so startup doesn't fail unless used.
    """
    global _client

    if _client:
        return _client

    try:
        import anthropic
    except ImportError as exc:
        raise NonRetryableStepError(
            "anthropic package not installed. Run: pip install anthropic",
            error_type="MISSING_DEPENDENCY",
            cause=exc,
        ) from exc

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise NonRetryableStepError(
            "ANTHROPIC_API_KEY not set in environment",
            error_type="AUTH_OR_CONFIG_ERROR",
        )

    _client = anthropic.Anthropic(api_key=api_key)
    return _client


# =========================================================
# MAIN GENERATION
# =========================================================

def generate(
    messages: List[Dict[str, Any]],
    model: Optional[str] = None,
) -> str:
    """
    Execute Anthropic Claude message completion.

    Args:
        messages: OpenAI-style message list
        model: optional model override

    Returns:
        str: model response text
    """
    client = _get_client()
    model_name = _normalize_model_name(model or ANTHROPIC_DEFAULT_MODEL)

    system_prompt, anthropic_messages = _transform_messages(messages)

    logger.info("[AnthropicAdapter] START model=%s", model_name)

    try:
        kwargs = {
            "model": model_name,
            "max_tokens": 2048,
            "messages": anthropic_messages,
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        response = client.messages.create(**kwargs)

        return _extract_response_text(response)

    except Exception as exc:
        logger.exception("[AnthropicAdapter] Invocation failed")

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
# MESSAGE TRANSFORMATION
# =========================================================

def _transform_messages(messages: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Transform OpenAI-style messages into Anthropic-compatible format.
    Anthropic expects:
    - separate system prompt
    - user/assistant messages only
    """
    system_prompt = ""
    anthropic_messages: List[Dict[str, Any]] = []

    for msg in messages or []:
        role = str(msg.get("role") or "").strip().lower()
        content = str(msg.get("content") or "").strip()

        if not content:
            continue

        if role == "system":
            system_prompt = content
            continue

        if role not in {"user", "assistant"}:
            role = "user"

        anthropic_messages.append({
            "role": role,
            "content": content,
        })

    if not anthropic_messages:
        anthropic_messages.append({
            "role": "user",
            "content": "",
        })

    return system_prompt, anthropic_messages


# =========================================================
# RESPONSE HANDLING
# =========================================================

def _extract_response_text(response: Any) -> str:
    """
    Normalize Anthropic response safely.
    """
    try:
        parts = getattr(response, "content", None)

        if not parts:
            return ""

        if isinstance(parts, list):
            texts = []

            for item in parts:
                text_value = getattr(item, "text", None)
                if text_value:
                    texts.append(str(text_value))

            return "\n".join(texts).strip()

        return str(parts).strip()

    except Exception as exc:
        raise RetryableStepError(
            f"Failed to parse Anthropic response: {exc}",
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
        return ANTHROPIC_DEFAULT_MODEL

    normalized = str(model_name).strip()

    if not normalized:
        return ANTHROPIC_DEFAULT_MODEL

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
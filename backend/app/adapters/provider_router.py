from __future__ import annotations

import logging
from typing import Callable, Dict, List, Optional

from app.runtime.errors import NonRetryableStepError, RetryableStepError


logger = logging.getLogger(__name__)


# =========================================================
# FREE MODELS CATALOGUE
# Curated free-tier models shown in the Agent Node UI.
# =========================================================
FREE_MODELS: Dict[str, str] = {
    "LLaMA 3.1 8B (Groq)":   "llama-3.1-8b-instant",
    "LLaMA 3.1 70B (Groq)":  "llama-3.1-70b-versatile",
    "LLaMA 3 70B (Groq)":    "llama3-70b-8192",
    "Gemma 2 9B (Groq)":      "gemma2-9b-it",
    "GPT-4o":                 "gpt-4o",
    "GPT-4o Mini":            "gpt-4o-mini",
    "Claude 3.5 Sonnet":      "claude-3-5-sonnet-20241022",
    "Claude 3 Haiku":         "claude-3-haiku-20240307",
}


class ProviderRouter:
    """
    Production-grade LLM provider router with 2-layer fallback.

    Fallback chain (per execution):
        Layer 1  User-selected model         (primary)
        Layer 2  Groq llama-3.1-8b-instant  (always-on fallback)
    """

    DEFAULT_PROVIDER = "groq"
    DEFAULT_MODEL = "llama-3.1-8b-instant"
    GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant"

    MODEL_PROVIDER_MAP: Dict[str, str] = {
        "gpt-4o":                      "openai",
        "gpt-4o-mini":                 "openai",
        "gpt-4-turbo":                 "openai",
        "gpt-4":                       "openai",
        "gpt-3.5-turbo":               "openai",
        "gpt-5":                       "openai",
        "claude-3":                    "anthropic",
        "claude-3-5-sonnet-20241022":  "anthropic",
        "claude-3-5-haiku-20241022":   "anthropic",
        "claude-3-opus-20240229":      "anthropic",
        "claude-3-sonnet-20240229":    "anthropic",
        "claude-3-haiku-20240307":     "anthropic",
        "gemini-pro":                  "gemini",
        "gemini-1.5-pro":              "gemini",
        "gemini-1.5-flash":            "gemini",
        "gemini-1.5-flash-001":        "gemini",
        "gemini-2.0-flash":            "gemini",
        "gemini-2.0-flash-exp":        "gemini",
        "llama-3.1-8b-instant":        "groq",
        "llama-3.1-70b-versatile":     "groq",
        "llama3-70b-8192":             "groq",
        "mixtral-8x7b-32768":          "groq",
        "gemma2-9b-it":                "groq",
        "deepseek-chat":               "deepseek",
        "deepseek-coder":              "deepseek",
        "deepseek-reasoner":           "deepseek",
        "deepseek-v3":                 "deepseek",
        "deepseek-r1":                 "deepseek",
    }

    MODEL_ALIASES: Dict[str, str] = {
        "gpt-4o (openai)":             "gpt-4o",
        "gpt-4o-mini (openai)":        "gpt-4o-mini",
        "claude 3.5 (anthropic)":      "claude-3-5-sonnet-20241022",
        "llama 3 (meta)":              "llama-3.1-8b-instant",
        "llama 3.1 8b (groq)":         "llama-3.1-8b-instant",
        "llama 3.1 70b (groq)":        "llama-3.1-70b-versatile",
        "llama 3 70b (groq)":          "llama3-70b-8192",
        "gemma 2 9b (groq)":           "gemma2-9b-it",
        "mistral":                     "mixtral-8x7b-32768",
        "deepseek":                    "deepseek-chat",
        "deepseek v3":                 "deepseek-v3",
        "deepseek r1":                 "deepseek-r1",
        "claude 3 haiku":              "claude-3-haiku-20240307",
        "claude 3.5 sonnet":           "claude-3-5-sonnet-20241022",
        "gpt-4o mini":                 "gpt-4o-mini",
    }

    # =========================================================
    # MAIN GENERATE — 3-layer fallback
    # =========================================================
    @classmethod
    def generate(cls, messages: List[dict], model: Optional[str] = None) -> str:
        normalized_model = cls.normalize_model_name(model)
        provider = cls.get_provider(normalized_model)

        logger.info(
            "[ProviderRouter] START model='%s' -> normalized='%s' -> provider='%s'",
            model, normalized_model, provider,
        )

        # ── Layer 1: Primary ──────────────────────────────────
        try:
            adapter = cls._get_adapter(provider)
            result = adapter(messages, normalized_model)
            logger.info("[ProviderRouter] SUCCESS layer=1 provider=%s model=%s", provider, normalized_model)
            return result
        except Exception as primary_exc:
            logger.warning(
                "[ProviderRouter] LAYER_1_FAILED provider=%s model=%s error=%s",
                provider, normalized_model, str(primary_exc),
            )

        # ── Layer 2: Groq fallback (always-on) ───────────────
        if provider == "groq" and normalized_model == cls.GROQ_FALLBACK_MODEL:
            raise NonRetryableStepError(
                "All LLM providers failed. Primary was already Groq default model.",
                error_type="ALL_PROVIDERS_FAILED",
            )

        try:
            from app.adapters.groq_adapter import generate as groq_generate
            result = groq_generate(messages, cls.GROQ_FALLBACK_MODEL)
            logger.info("[ProviderRouter] SUCCESS layer=2 provider=groq model=%s", cls.GROQ_FALLBACK_MODEL)
            return result
        except Exception as groq_exc:
            logger.exception("[ProviderRouter] LAYER_2_FAILED — all layers exhausted error=%s", str(groq_exc))
            raise NonRetryableStepError(
                f"All 2 LLM provider layers failed. Last error: {str(groq_exc)}",
                error_type="ALL_PROVIDERS_FAILED",
                details={
                    "primary_provider": provider,
                    "primary_model": normalized_model,
                    "groq_fallback": cls.GROQ_FALLBACK_MODEL,
                },
                cause=groq_exc,
            ) from groq_exc

    # =========================================================
    # PROVIDER RESOLUTION
    # =========================================================
    @classmethod
    def get_provider(cls, model_name: Optional[str]) -> str:
        if not model_name:
            return cls.DEFAULT_PROVIDER

        normalized = cls.normalize_model_name(model_name)

        if normalized in cls.MODEL_PROVIDER_MAP:
            return cls.MODEL_PROVIDER_MAP[normalized]

        lower = normalized.lower()
        if lower.startswith("gpt"):        return "openai"
        if lower.startswith("claude"):     return "anthropic"
        if lower.startswith("gemini"):     return "gemini"
        if lower.startswith("deepseek"):   return "deepseek"
        if any(lower.startswith(p) for p in ["llama", "mixtral", "gemma", "whisper"]):
            return "groq"

        logger.warning("[ProviderRouter] Unknown model '%s', defaulting to %s", normalized, cls.DEFAULT_PROVIDER)
        return cls.DEFAULT_PROVIDER

    @classmethod
    def normalize_model_name(cls, model_name: Optional[str]) -> str:
        if not model_name:
            return cls.DEFAULT_MODEL

        normalized = str(model_name).strip()
        alias = cls.MODEL_ALIASES.get(normalized.lower())
        if alias:
            return alias
        return normalized

    # =========================================================
    # ADAPTER REGISTRY
    # =========================================================
    @classmethod
    def _get_adapter(cls, provider: str) -> Callable[[List[dict], Optional[str]], str]:
        if provider == "groq":
            from app.adapters.groq_adapter import generate
            return generate
        if provider == "openai":
            from app.adapters.openai_adapter import generate
            return generate
        if provider == "anthropic":
            from app.adapters.anthropic_adapter import generate
            return generate
        if provider == "gemini":
            from app.adapters.gemini_adapter import generate
            return generate
        if provider == "deepseek":
            from app.adapters.deepseek_adapter import generate
            return generate

        raise NonRetryableStepError(
            f"No adapter registered for provider: {provider}",
            error_type="CONFIG_ERROR",
            details={"provider": provider},
        )

    # =========================================================
    # FREE MODELS CATALOGUE HELPER (used by API endpoint)
    # =========================================================
    @classmethod
    def get_free_models(cls) -> List[Dict[str, str]]:
        result = []
        for label, model_id in FREE_MODELS.items():
            result.append({
                "label": label,
                "model_id": model_id,
                "provider": cls.get_provider(model_id),
            })
        return result


# =========================================================
# BACKWARD-COMPATIBLE FUNCTION EXPORTS
# =========================================================

def _get_provider(model_name: Optional[str]) -> str:
    return ProviderRouter.get_provider(model_name)


def normalize_model_name(model_name: Optional[str]) -> str:
    return ProviderRouter.normalize_model_name(model_name)


def generate(messages: List[dict], model: Optional[str] = None) -> str:
    return ProviderRouter.generate(messages, model)
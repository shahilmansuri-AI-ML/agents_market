import logging
from typing import Any, Dict, Optional

from app.adapters.groq_adapter import GROQ_DEFAULT_MODEL
from app.runtime.errors import NonRetryableStepError

logger = logging.getLogger(__name__)


class LLMStrand:
    """
    Executes LLM calls using the configured provider/model.

    Routes through ProviderRouter which enforces a 3-layer fallback:
        Layer 1  User-selected model
        Layer 2  DeepSeek (1st fallback)
        Layer 3  Groq     (2nd fallback — always-on)

    Supported primary providers: groq, gemini, openai, anthropic, deepseek
    """

    SUPPORTED_PROVIDERS = {"groq", "gemini", "openai", "anthropic", "deepseek"}
    GEMINI_ALIASES = {"google", "gemini api", "google gemini"}

    def __init__(self, model: Any) -> None:
        self.model = model

    def execute(self, system_prompt: str, user_input: str) -> str:
        messages = self._build_messages(system_prompt, user_input)
        model_config = self._normalize_model_config(self.model)

        provider_name = model_config["provider_name"]
        model_name = model_config["model_name"]
        model_api = model_config.get("model_api")

        logger.info(
            "[LLMStrand] Executing | provider=%s | model=%s",
            provider_name, model_name,
        )

        # Delegate entirely to ProviderRouter which handles all providers
        # and the 3-layer fallback chain automatically.
        from app.adapters.provider_router import ProviderRouter
        return ProviderRouter.generate(messages, model_name)

    def _build_messages(self, system_prompt: str, user_input: str) -> list[Dict[str, str]]:
        return [
            {"role": "system", "content": system_prompt or ""},
            {"role": "user",   "content": user_input or ""},
        ]

    def _normalize_model_config(self, model: Any) -> Dict[str, Optional[str]]:
        provider_name = ""
        model_name = None
        model_api = None

        if isinstance(model, dict):
            provider_name = str(
                model.get("provider_name") or model.get("provider") or ""
            ).strip().lower()
            model_name = (
                model.get("model_name") or model.get("name") or model.get("model")
            )
            model_api = (
                model.get("model_api") or model.get("api_key") or model.get("api_link")
            )
        else:
            model_name = model

        model_name = self._sanitize_model_name(model_name)

        if not provider_name:
            provider_name = self._infer_provider_name(model_name)

        if provider_name in self.GEMINI_ALIASES:
            provider_name = "gemini"

        if provider_name not in self.SUPPORTED_PROVIDERS:
            logger.warning(
                "[LLMStrand] Unsupported provider '%s'; ProviderRouter will handle fallback",
                provider_name,
            )

        return {
            "provider_name": provider_name,
            "model_name": model_name,
            "model_api": str(model_api).strip() if model_api else None,
        }

    def _sanitize_model_name(self, model_name: Any) -> str:
        if model_name is None:
            return GROQ_DEFAULT_MODEL
        sanitized = str(model_name).strip()
        return sanitized if sanitized else GROQ_DEFAULT_MODEL

    def _infer_provider_name(self, model_name: str) -> str:
        normalized = str(model_name or "").strip().lower()
        if "gemini" in normalized or "google" in normalized:
            return "gemini"
        if "deepseek" in normalized:
            return "deepseek"
        if any(p in normalized for p in ["gpt-", "gpt4", "gpt3"]):
            return "openai"
        if "claude" in normalized:
            return "anthropic"
        return "groq"
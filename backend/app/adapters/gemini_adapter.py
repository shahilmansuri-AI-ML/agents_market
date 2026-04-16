import os
import logging
from dotenv import load_dotenv
from app.runtime.errors import RetryableStepError, NonRetryableStepError

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "gemini-1.0-pro")
api_key = os.getenv("GEMINI_API_KEY")


def generate(messages, model=None):
    try:
        import google.generativeai as genai
    except ImportError:
        raise NonRetryableStepError(
            "google-generativeai package not installed. Run: pip install google-generativeai",
            error_type="MISSING_DEPENDENCY"
        )

    if not api_key:
        raise NonRetryableStepError(
            "GEMINI_API_KEY not set in environment",
            error_type="AUTH_OR_CONFIG_ERROR"
        )

    genai.configure(api_key=api_key)
    model_name = model or GEMINI_DEFAULT_MODEL

    # Gemini uses a different message format — convert from OpenAI-style
    # System prompt becomes the first user message if no system role support
    gemini_history = []
    system_text = None

    for msg in messages:
        if msg["role"] == "system":
            system_text = msg["content"]
        elif msg["role"] == "user":
            content = msg["content"]
            if system_text:
                # Prepend system prompt to first user message
                content = f"{system_text}\n\n{content}"
                system_text = None
            gemini_history.append({"role": "user", "parts": [content]})
        elif msg["role"] == "assistant":
            gemini_history.append({"role": "model", "parts": [msg["content"]]})

    try:
        gemini_model = genai.GenerativeModel(model_name)

        if len(gemini_history) == 1:
            response = gemini_model.generate_content(gemini_history[0]["parts"][0])
        else:
            # Multi-turn: start chat with history minus last message
            chat = gemini_model.start_chat(history=gemini_history[:-1])
            last_msg = gemini_history[-1]["parts"][0]
            response = chat.send_message(last_msg)

        return response.text

    except Exception as e:
        message = str(e).lower()
        logger.error("Gemini error: %s", message)

        retryable_keywords = [
                "timeout", "rate limit", "quota", "temporarily unavailable",
                "503", "502", "429", "internal", "resource exhausted",
                "deadline", "unavailable", "overloaded"
            ]
        if any(k in message for k in retryable_keywords):
            raise RetryableStepError(str(e), error_type="LLM_PROVIDER_ERROR")

        non_retryable_keywords = [
            "api key", "authentication", "unauthorized",
            "invalid", "bad request", "not found", "permission"
        ]
        if any(k in message for k in non_retryable_keywords):
            raise NonRetryableStepError(str(e), error_type="AUTH_OR_CONFIG_ERROR")

        raise RetryableStepError(str(e), error_type="UNKNOWN_LLM_ERROR")
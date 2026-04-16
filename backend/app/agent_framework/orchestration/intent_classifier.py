from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict

from app.agent_framework.core.models import AgentRequest, IntentResult


class IntentClassifier(ABC):
    @abstractmethod
    def classify(self, request: AgentRequest) -> IntentResult:
        pass


class KeywordIntentClassifier(IntentClassifier):
    """
    Simple config-driven classifier.

    Config shape:
    {
      "intent_name": ["keyword1", "keyword2"]
    }
    """

    def __init__(self, intent_keywords: Dict[str, list[str]], default_intent: str = "general") -> None:
        self._intent_keywords = intent_keywords
        self._default_intent = default_intent

    def classify(self, request: AgentRequest) -> IntentResult:
        text = request.text.lower()
        best_intent = self._default_intent
        best_score = 0.0

        for intent, keywords in self._intent_keywords.items():
            if not keywords:
                continue

            hits = sum(1 for keyword in keywords if keyword.lower() in text)
            score = hits / max(len(keywords), 1)

            if score > best_score:
                best_score = score
                best_intent = intent

        confidence = best_score if best_score > 0 else 0.25
        return IntentResult(label=best_intent, confidence=confidence)

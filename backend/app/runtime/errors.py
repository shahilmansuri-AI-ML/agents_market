from __future__ import annotations

from typing import Any, Dict, Optional


class StepExecutionError(Exception):
    """
    Base exception for runtime step execution errors.

    Use this for structured runtime failures so the coordinator / executor
    can decide whether to retry, fail permanently, or log rich context.
    """

    DEFAULT_ERROR_TYPE = "STEP_EXECUTION_ERROR"

    def __init__(
        self,
        message: str,
        error_type: str = DEFAULT_ERROR_TYPE,
        retryable: bool = False,
        details: Optional[Dict[str, Any]] = None,
        step_key: Optional[str] = None,
        cause: Optional[Exception] = None,
    ) -> None:
        normalized_message = str(message).strip() if message else "Unknown step execution error"

        super().__init__(normalized_message)

        self.message = normalized_message
        self.error_type = str(error_type or self.DEFAULT_ERROR_TYPE).strip().upper()
        self.retryable = bool(retryable)
        self.details = self._normalize_details(details)
        self.step_key = str(step_key).strip() if step_key else None
        self.cause = cause

    # =========================================================
    # SERIALIZATION
    # =========================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert exception into structured payload for logs / DB / API.
        """
        return {
            "message": self.message,
            "error_type": self.error_type,
            "retryable": self.retryable,
            "step_key": self.step_key,
            "details": self.details,
            "cause": str(self.cause) if self.cause else None,
        }

    def to_log_payload(self) -> Dict[str, Any]:
        """
        Alias for structured logging payload.
        """
        return self.to_dict()

    # =========================================================
    # HELPERS
    # =========================================================

    def with_step_key(self, step_key: str) -> "StepExecutionError":
        """
        Attach / override step key without mutating behavior contract.
        Useful for propagating context higher in the runtime stack.
        """
        self.step_key = str(step_key).strip() if step_key else None
        return self

    def is_retryable(self) -> bool:
        """
        Explicit helper for runtime orchestration logic.
        """
        return self.retryable

    def _normalize_details(self, details: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ensure details is always a safe dictionary.
        """
        if not isinstance(details, dict):
            return {}

        normalized: Dict[str, Any] = {}
        for key, value in details.items():
            try:
                normalized[str(key)] = value
            except Exception:
                normalized[str(key)] = str(value)

        return normalized

    # =========================================================
    # STRING / DEBUG
    # =========================================================

    def __str__(self) -> str:
        return self.message

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"error_type={self.error_type!r}, "
            f"retryable={self.retryable!r}, "
            f"step_key={self.step_key!r})"
        )


class RetryableStepError(StepExecutionError):
    """
    Runtime error that is safe to retry.

    Examples:
    - transient API failures
    - LLM timeouts
    - temporary network issues
    """

    DEFAULT_ERROR_TYPE = "RETRYABLE_ERROR"

    def __init__(
        self,
        message: str,
        error_type: str = DEFAULT_ERROR_TYPE,
        details: Optional[Dict[str, Any]] = None,
        step_key: Optional[str] = None,
        cause: Optional[Exception] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_type=error_type,
            retryable=True,
            details=details,
            step_key=step_key,
            cause=cause,
        )


class NonRetryableStepError(StepExecutionError):
    """
    Runtime error that should fail permanently.

    Examples:
    - invalid input
    - bad tool config
    - unsupported workflow state
    """

    DEFAULT_ERROR_TYPE = "NON_RETRYABLE_ERROR"

    def __init__(
        self,
        message: str,
        error_type: str = DEFAULT_ERROR_TYPE,
        details: Optional[Dict[str, Any]] = None,
        step_key: Optional[str] = None,
        cause: Optional[Exception] = None,
    ) -> None:
        super().__init__(
            message=message,
            error_type=error_type,
            retryable=False,
            details=details,
            step_key=step_key,
            cause=cause,
        )
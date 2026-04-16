from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


logger = logging.getLogger(__name__)


# =========================================================
# CONSTANTS
# =========================================================
A2A_PROTOCOL = "a2a"
A2A_VERSION = "1.0"

MAX_PAYLOAD_SIZE = 50_000  # safeguard (approx chars when serialized)


# =========================================================
# MODEL
# =========================================================
class A2AMessage(BaseModel):
    """
    Standard Agent-to-Agent (A2A) message schema.

    This is used to:
    - Pass data between workflow nodes
    - Maintain traceability
    - Enable debugging and observability
    """

    protocol: str = A2A_PROTOCOL
    protocol_version: str = A2A_VERSION

    message_id: str = Field(default_factory=lambda: str(uuid4()))
    execution_id: str
    trace_id: str
    correlation_id: str

    message_type: Literal["handoff", "event", "result"] = "handoff"

    from_node_id: str
    to_node_id: Optional[str] = None

    payload: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    # =========================================================
    # VALIDATIONS
    # =========================================================

    @field_validator("execution_id", "trace_id", "correlation_id")
    @classmethod
    def validate_ids(cls, value: str) -> str:
        if not value or not str(value).strip():
            raise ValueError("ID fields must be non-empty strings")
        return str(value).strip()

    @field_validator("from_node_id")
    @classmethod
    def validate_from_node(cls, value: str) -> str:
        if not value:
            raise ValueError("from_node_id is required")
        return str(value)

    @field_validator("payload")
    @classmethod
    def validate_payload_size(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        try:
            size = len(str(value))
            if size > MAX_PAYLOAD_SIZE:
                logger.warning(
                    "[A2AMessage] Payload too large (%s chars), truncating",
                    size,
                )
                return {"text": "Payload truncated due to size limits"}
        except Exception:
            logger.warning("[A2AMessage] Failed to measure payload size")

        return value

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        return value or {}

    # =========================================================
    # HELPERS
    # =========================================================

    def to_dict(self) -> Dict[str, Any]:
        """
        Safe export method.
        """
        return self.model_dump()

    def log_summary(self) -> None:
        """
        Lightweight structured logging for observability.
        """
        logger.info(
            "[A2AMessage] type=%s execution_id=%s from=%s to=%s",
            self.message_type,
            self.execution_id,
            self.from_node_id,
            self.to_node_id,
        )


# =========================================================
# FACTORY FUNCTION
# =========================================================
def build_a2a_handoff(
    *,
    execution_id: str,
    trace_id: str,
    from_node_id: str,
    to_node_id: Optional[str],
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build a standard A2A handoff message between nodes.

    This function is used by GraphExecutor after each node execution.

    Returns:
        dict: Serialized A2A message
    """
    try:
        message = A2AMessage(
            execution_id=execution_id,
            trace_id=trace_id,
            correlation_id=execution_id,  # keeps grouping consistent
            from_node_id=from_node_id,
            to_node_id=to_node_id,
            payload=payload or {},
            metadata=metadata or {},
        )

        message.log_summary()

        return message.to_dict()

    except Exception as error:
        logger.exception(
            "[A2A] Failed to build handoff message | execution_id=%s error=%s",
            execution_id,
            str(error),
        )

        # Fallback safe message (never break pipeline)
        return {
            "protocol": A2A_PROTOCOL,
            "protocol_version": A2A_VERSION,
            "message_id": str(uuid4()),
            "execution_id": execution_id,
            "trace_id": trace_id,
            "correlation_id": execution_id,
            "message_type": "handoff",
            "from_node_id": from_node_id,
            "to_node_id": to_node_id,
            "payload": {"text": "A2A message generation failed"},
            "metadata": {"error": str(error)},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

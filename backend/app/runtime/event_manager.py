from __future__ import annotations

import json
import logging
import uuid
from typing import Any, List, Mapping, Optional

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


logger = logging.getLogger(__name__)


class EventManager:
    """
    Production-grade runtime event manager.

    Responsibilities:
    - emit execution events
    - fetch execution timeline
    - fetch step-level events
    - fetch latest event
    - provide structured runtime observability
    """

    DEFAULT_SOURCE = "executor"
    DEFAULT_LIMIT = 100
    MAX_LIMIT = 1000

    # =========================================================
    # SQL QUERIES
    # =========================================================
    INSERT_EVENT_SQL = text("""
        INSERT INTO execution_events (
            event_id,
            execution_id,
            step_execution_id,
            event_type,
            source,
            event_payload,
            created_at
        )
        VALUES (
            :event_id,
            :execution_id,
            :step_execution_id,
            :event_type,
            :source,
            CAST(:payload AS JSONB),
            NOW()
        )
    """)

    GET_EXECUTION_EVENTS_SQL = text("""
        SELECT
            event_id,
            execution_id,
            step_execution_id,
            event_type,
            source,
            event_payload,
            created_at
        FROM execution_events
        WHERE execution_id = :execution_id
        ORDER BY created_at ASC
        LIMIT :limit
    """)

    GET_STEP_EVENTS_SQL = text("""
        SELECT
            event_id,
            execution_id,
            step_execution_id,
            event_type,
            source,
            event_payload,
            created_at
        FROM execution_events
        WHERE step_execution_id = :step_execution_id
        ORDER BY created_at ASC
        LIMIT :limit
    """)

    GET_LATEST_EVENT_SQL = text("""
        SELECT
            event_id,
            execution_id,
            step_execution_id,
            event_type,
            source,
            event_payload,
            created_at
        FROM execution_events
        WHERE execution_id = :execution_id
        ORDER BY created_at DESC
        LIMIT 1
    """)

    # =========================================================
    # WRITE / EMIT
    # =========================================================
    def emit(
        self,
        session,
        execution_id: str | uuid.UUID,
        step_execution_id: Optional[str | uuid.UUID],
        event_type: str,
        payload: Any,
        source: str = DEFAULT_SOURCE,
    ) -> str:
        """
        Emit an execution event.

        Returns:
            event_id (str)
        """
        execution_id_str = self._normalize_id(execution_id, "execution_id")
        step_execution_id_str = self._normalize_optional_id(step_execution_id)
        event_type = self._normalize_event_type(event_type)
        source = self._normalize_source(source)

        event_id = str(uuid.uuid4())

        try:
            session.execute(
                self.INSERT_EVENT_SQL,
                {
                    "event_id": event_id,
                    "execution_id": execution_id_str,
                    "step_execution_id": step_execution_id_str,
                    "event_type": event_type,
                    "source": source,
                    "payload": self._to_json(payload),
                },
            )

            logger.info(
                "[EventManager] EVENT_EMITTED execution_id=%s step_execution_id=%s event_type=%s event_id=%s source=%s",
                execution_id_str,
                step_execution_id_str,
                event_type,
                event_id,
                source,
            )

            return event_id

        except SQLAlchemyError as exc:
            logger.exception(
                "[EventManager] EMIT_FAILED execution_id=%s event_type=%s error=%s",
                execution_id_str,
                event_type,
                str(exc),
            )
            raise

    # =========================================================
    # READ / FETCH
    # =========================================================
    def get_execution_events(
        self,
        session,
        execution_id: str | uuid.UUID,
        limit: int = DEFAULT_LIMIT,
    ) -> List[Mapping[str, Any]]:
        """
        Fetch execution-level event timeline ordered by creation time.
        """
        execution_id_str = self._normalize_id(execution_id, "execution_id")
        safe_limit = self._normalize_limit(limit)

        try:
            rows = session.execute(
                self.GET_EXECUTION_EVENTS_SQL,
                {
                    "execution_id": execution_id_str,
                    "limit": safe_limit,
                },
            ).mappings().all()

            logger.info(
                "[EventManager] EXECUTION_EVENTS_LOADED execution_id=%s count=%s limit=%s",
                execution_id_str,
                len(rows),
                safe_limit,
            )

            return list(rows)

        except SQLAlchemyError as exc:
            logger.exception(
                "[EventManager] GET_EXECUTION_EVENTS_FAILED execution_id=%s error=%s",
                execution_id_str,
                str(exc),
            )
            raise

    def get_step_events(
        self,
        session,
        step_execution_id: str | uuid.UUID,
        limit: int = DEFAULT_LIMIT,
    ) -> List[Mapping[str, Any]]:
        """
        Fetch events for a specific step execution.
        """
        step_execution_id_str = self._normalize_id(step_execution_id, "step_execution_id")
        safe_limit = self._normalize_limit(limit)

        try:
            rows = session.execute(
                self.GET_STEP_EVENTS_SQL,
                {
                    "step_execution_id": step_execution_id_str,
                    "limit": safe_limit,
                },
            ).mappings().all()

            logger.info(
                "[EventManager] STEP_EVENTS_LOADED step_execution_id=%s count=%s limit=%s",
                step_execution_id_str,
                len(rows),
                safe_limit,
            )

            return list(rows)

        except SQLAlchemyError as exc:
            logger.exception(
                "[EventManager] GET_STEP_EVENTS_FAILED step_execution_id=%s error=%s",
                step_execution_id_str,
                str(exc),
            )
            raise

    def get_latest_event(
        self,
        session,
        execution_id: str | uuid.UUID,
    ) -> Optional[Mapping[str, Any]]:
        """
        Fetch the most recent event for an execution.
        """
        execution_id_str = self._normalize_id(execution_id, "execution_id")

        try:
            row = session.execute(
                self.GET_LATEST_EVENT_SQL,
                {"execution_id": execution_id_str},
            ).mappings().first()

            if row:
                logger.info(
                    "[EventManager] LATEST_EVENT_LOADED execution_id=%s event_type=%s",
                    execution_id_str,
                    row["event_type"],
                )
            else:
                logger.info(
                    "[EventManager] NO_EVENTS execution_id=%s",
                    execution_id_str,
                )

            return row

        except SQLAlchemyError as exc:
            logger.exception(
                "[EventManager] GET_LATEST_EVENT_FAILED execution_id=%s error=%s",
                execution_id_str,
                str(exc),
            )
            raise

    # =========================================================
    # INTERNAL HELPERS
    # =========================================================
    def _normalize_id(self, value: str | uuid.UUID, field_name: str) -> str:
        """
        Normalize required IDs to string.
        """
        if value is None:
            raise ValueError(f"{field_name} is required")

        normalized = str(value).strip()

        if not normalized:
            raise ValueError(f"{field_name} cannot be empty")

        return normalized

    def _normalize_optional_id(self, value: Optional[str | uuid.UUID]) -> Optional[str]:
        """
        Normalize optional IDs to string.
        """
        if value is None:
            return None

        normalized = str(value).strip()
        return normalized or None

    def _normalize_event_type(self, event_type: str) -> str:
        """
        Normalize event type safely.
        """
        if event_type is None:
            raise ValueError("event_type is required")

        normalized = str(event_type).strip().upper()

        if not normalized:
            raise ValueError("event_type cannot be empty")

        return normalized

    def _normalize_source(self, source: str) -> str:
        """
        Normalize source safely.
        """
        if source is None:
            return self.DEFAULT_SOURCE

        normalized = str(source).strip()
        return normalized or self.DEFAULT_SOURCE

    def _normalize_limit(self, limit: int) -> int:
        """
        Ensure limit stays in safe range.
        """
        try:
            safe_limit = int(limit)
        except Exception:
            return self.DEFAULT_LIMIT

        if safe_limit <= 0:
            return self.DEFAULT_LIMIT

        return min(safe_limit, self.MAX_LIMIT)

    def _to_json(self, value: Any) -> str:
        """
        Safely serialize Python object to JSON string.
        Handles UUID, datetime, etc.
        """
        try:
            return json.dumps(value, default=str, ensure_ascii=False)
        except Exception:
            logger.exception("[EventManager] JSON serialization failed")
            return json.dumps({"fallback": str(value)}, ensure_ascii=False)
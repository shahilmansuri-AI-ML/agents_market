import json
import logging
import uuid
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


class StateManager:
    """
    runtime state manager.

    Responsibilities:
    - initialize execution state
    - update execution state snapshot
    - fetch current state
    - optionally write execution events
    - maintain state versioning for runtime tracking
    """

    # =========================================================
    # INITIALIZE
    # =========================================================

    def initialize_state(self, session, execution_id: str | uuid.UUID) -> bool:
        """
        Initialize execution state if it does not already exist.

        Returns:
            True if inserted
            False if already existed
        """
        execution_id = str(execution_id)

        try:
            result = session.execute(
                text("""
                    INSERT INTO execution_state (
                        execution_id,
                        state_snapshot,
                        last_completed_step_key,
                        version,
                        updated_at
                    )
                    VALUES (
                        :execution_id,
                        CAST(:state_snapshot AS JSONB),
                        NULL,
                        1,
                        NOW()
                    )
                    ON CONFLICT (execution_id)
                    DO NOTHING
                """),
                {
                    "execution_id": execution_id,
                    "state_snapshot": self._to_json({}),
                },
            )

            inserted = result.rowcount > 0

            if inserted:
                logger.info(
                    "[StateManager] Initialized state execution_id=%s",
                    execution_id,
                )
            else:
                logger.info(
                    "[StateManager] State already exists execution_id=%s",
                    execution_id,
                )

            return inserted

        except SQLAlchemyError as exc:
            logger.exception(
                "[StateManager] Failed to initialize state execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise

    # =========================================================
    # UPDATE
    # =========================================================

    def update_state(
        self,
        session,
        execution_id: str | uuid.UUID,
        state: Any,
        step_key: Optional[str] = None,
    ) -> bool:
        """
        Update execution state snapshot and increment version.

        Returns:
            True if state updated
            False if no matching execution state row found
        """
        execution_id = str(execution_id)

        try:
            result = session.execute(
                text("""
                    UPDATE execution_state
                    SET
                        state_snapshot = CAST(:state AS JSONB),
                        last_completed_step_key = :step_key,
                        version = version + 1,
                        updated_at = NOW()
                    WHERE execution_id = :execution_id
                """),
                {
                    "execution_id": execution_id,
                    "state": self._to_json(state),
                    "step_key": step_key,
                },
            )

            updated = result.rowcount > 0

            if updated:
                logger.info(
                    "[StateManager] Updated state execution_id=%s step_key=%s",
                    execution_id,
                    step_key,
                )
            else:
                logger.warning(
                    "[StateManager] No state row found to update execution_id=%s",
                    execution_id,
                )

            return updated

        except SQLAlchemyError as exc:
            logger.exception(
                "[StateManager] Failed to update state execution_id=%s step_key=%s error=%s",
                execution_id,
                step_key,
                str(exc),
            )
            raise

    # =========================================================
    # READ
    # =========================================================

    def get_state(self, session, execution_id: str | uuid.UUID):
        """
        Fetch current execution state.
        """
        execution_id = str(execution_id)

        try:
            state_row = session.execute(
                text("""
                    SELECT
                        execution_id,
                        state_snapshot,
                        last_completed_step_key,
                        version,
                        updated_at
                    FROM execution_state
                    WHERE execution_id = :execution_id
                    LIMIT 1
                """),
                {"execution_id": execution_id},
            ).mappings().first()

            if not state_row:
                logger.warning(
                    "[StateManager] State not found execution_id=%s",
                    execution_id,
                )
                return None

            logger.info(
                "[StateManager] Loaded state execution_id=%s version=%s",
                execution_id,
                state_row["version"],
            )

            return state_row

        except SQLAlchemyError as exc:
            logger.exception(
                "[StateManager] Failed to fetch state execution_id=%s error=%s",
                execution_id,
                str(exc),
            )
            raise

    # =========================================================
    # OPTIONAL: SAFE UPSERT UPDATE
    # =========================================================

    def upsert_state(
        self,
        session,
        execution_id: str | uuid.UUID,
        state: Any,
        step_key: Optional[str] = None,
    ) -> None:
        """
        Initialize or update state in one call.
        Useful if caller is unsure whether state row exists.
        """
        execution_id = str(execution_id)

        try:
            session.execute(
                text("""
                    INSERT INTO execution_state (
                        execution_id,
                        state_snapshot,
                        last_completed_step_key,
                        version,
                        updated_at
                    )
                    VALUES (
                        :execution_id,
                        CAST(:state AS JSONB),
                        :step_key,
                        1,
                        NOW()
                    )
                    ON CONFLICT (execution_id)
                    DO UPDATE SET
                        state_snapshot = CAST(:state AS JSONB),
                        last_completed_step_key = :step_key,
                        version = execution_state.version + 1,
                        updated_at = NOW()
                """),
                {
                    "execution_id": execution_id,
                    "state": self._to_json(state),
                    "step_key": step_key,
                },
            )

            logger.info(
                "[StateManager] Upserted state execution_id=%s step_key=%s",
                execution_id,
                step_key,
            )

        except SQLAlchemyError as exc:
            logger.exception(
                "[StateManager] Failed to upsert state execution_id=%s step_key=%s error=%s",
                execution_id,
                step_key,
                str(exc),
            )
            raise

    # =========================================================
    # OPTIONAL: EVENT WRITING
    # =========================================================

    def write_event(
        self,
        session,
        execution_id: str | uuid.UUID,
        step_execution_id: Optional[str | uuid.UUID],
        event_type: str,
        payload: Any,
        source: str = "executor",
    ) -> str:
        """
        Write execution event directly.

        NOTE:
        Prefer using dedicated EventManager if your architecture already has one.
        """
        execution_id = str(execution_id)
        step_execution_id = str(step_execution_id) if step_execution_id else None
        event_id = str(uuid.uuid4())

        try:
            session.execute(
                text("""
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
                """),
                {
                    "event_id": event_id,
                    "execution_id": execution_id,
                    "step_execution_id": step_execution_id,
                    "event_type": event_type,
                    "source": source,
                    "payload": self._to_json(payload),
                },
            )

            logger.info(
                "[StateManager] Event written execution_id=%s event_type=%s",
                execution_id,
                event_type,
            )

            return event_id

        except SQLAlchemyError as exc:
            logger.exception(
                "[StateManager] Failed to write event execution_id=%s event_type=%s error=%s",
                execution_id,
                event_type,
                str(exc),
            )
            raise

    # =========================================================
    # INTERNAL
    # =========================================================

    def _to_json(self, value: Any) -> str:
        """
        Safely serialize Python object to JSON string.
        Handles UUID, datetime, etc.
        """
        return json.dumps(value, default=str, ensure_ascii=False)
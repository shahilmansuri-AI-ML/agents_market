import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger(__name__)


class LockManager:
    """
    execution lock manager.

    Responsibilities:
    - acquire execution locks safely
    - release locks safely
    - clean expired locks
    - optionally renew lock TTL
    - verify lock ownership when needed

    """

    DEFAULT_LOCK_TTL_MINUTES = 30

    # =========================================================
    # ACQUIRE
    # =========================================================

    def acquire_execution_lock(
        self,
        session,
        execution_id: str | uuid.UUID,
        worker_id: str,
        ttl_minutes: int = DEFAULT_LOCK_TTL_MINUTES,
    ) -> bool:
        """
        Acquire a lock for a given execution.

        Returns:
            True  -> lock acquired successfully
            False -> lock already exists / another worker owns it

        Raises:
            SQLAlchemyError for unexpected DB failures
        """
        execution_id = str(execution_id)
        expires_at = self._utc_now() + timedelta(minutes=ttl_minutes)

        try:
            self.cleanup_expired_locks(session)

            session.execute(
                text("""
                    INSERT INTO execution_locks (
                        lock_id,
                        execution_id,
                        step_execution_id,
                        lock_type,
                        locked_by,
                        expires_at,
                        created_at
                    )
                    VALUES (
                        gen_random_uuid(),
                        :execution_id,
                        NULL,
                        'execution',
                        :worker_id,
                        :expires_at,
                        NOW()
                    )
                    ON CONFLICT (execution_id)
                    WHERE step_execution_id IS NULL
                    DO NOTHING
                """),
                {
                    "execution_id": execution_id,
                    "worker_id": worker_id,
                    "expires_at": expires_at,
                },
            )

            lock_row = session.execute(
                text("""
                    SELECT locked_by, expires_at
                    FROM execution_locks
                    WHERE execution_id = :execution_id
                      AND step_execution_id IS NULL
                    LIMIT 1
                """),
                {"execution_id": execution_id},
            ).mappings().first()

            if not lock_row:
                logger.warning(
                    "[LockManager] Lock insert produced no row execution_id=%s worker_id=%s",
                    execution_id,
                    worker_id,
                )
                return False

            acquired = str(lock_row["locked_by"]) == worker_id

            if acquired:
                logger.info(
                    "[LockManager] Lock acquired execution_id=%s worker_id=%s expires_at=%s",
                    execution_id,
                    worker_id,
                    lock_row["expires_at"],
                )
            else:
                logger.info(
                    "[LockManager] Lock already held execution_id=%s requested_by=%s held_by=%s",
                    execution_id,
                    worker_id,
                    lock_row["locked_by"],
                )

            return acquired

        except IntegrityError:
            logger.info(
                "[LockManager] Lock conflict execution_id=%s worker_id=%s",
                execution_id,
                worker_id,
            )
            return False

        except SQLAlchemyError as exc:
            logger.exception(
                "[LockManager] Failed to acquire lock execution_id=%s worker_id=%s error=%s",
                execution_id,
                worker_id,
                str(exc),
            )
            raise

    # =========================================================
    # RELEASE
    # =========================================================

    def release_execution_lock(
        self,
        session,
        execution_id: str | uuid.UUID,
        worker_id: Optional[str] = None,
    ) -> bool:
        """
        Release a lock for a given execution.

        If worker_id is provided, only that owner can release the lock.

        Returns:
            True  -> lock deleted
            False -> no lock found / worker mismatch
        """
        execution_id = str(execution_id)

        try:
            if worker_id:
                result = session.execute(
                    text("""
                        DELETE FROM execution_locks
                        WHERE execution_id = :execution_id
                          AND step_execution_id IS NULL
                          AND locked_by = :worker_id
                    """),
                    {
                        "execution_id": execution_id,
                        "worker_id": worker_id,
                    },
                )
            else:
                result = session.execute(
                    text("""
                        DELETE FROM execution_locks
                        WHERE execution_id = :execution_id
                          AND step_execution_id IS NULL
                    """),
                    {"execution_id": execution_id},
                )

            deleted = result.rowcount > 0

            if deleted:
                logger.info(
                    "[LockManager] Lock released execution_id=%s worker_id=%s",
                    execution_id,
                    worker_id or "ANY",
                )
            else:
                logger.warning(
                    "[LockManager] No lock released execution_id=%s worker_id=%s",
                    execution_id,
                    worker_id or "ANY",
                )

            return deleted

        except SQLAlchemyError as exc:
            logger.exception(
                "[LockManager] Failed to release lock execution_id=%s worker_id=%s error=%s",
                execution_id,
                worker_id or "ANY",
                str(exc),
            )
            raise

    # =========================================================
    # HEARTBEAT / RENEW
    # =========================================================

    def renew_execution_lock(
        self,
        session,
        execution_id: str | uuid.UUID,
        worker_id: str,
        ttl_minutes: int = DEFAULT_LOCK_TTL_MINUTES,
    ) -> bool:
        """
        Extend lock expiry if lock is still owned by this worker.

        Useful for long-running executions.
        """
        execution_id = str(execution_id)
        new_expires_at = self._utc_now() + timedelta(minutes=ttl_minutes)

        try:
            result = session.execute(
                text("""
                    UPDATE execution_locks
                    SET expires_at = :expires_at
                    WHERE execution_id = :execution_id
                      AND step_execution_id IS NULL
                      AND locked_by = :worker_id
                """),
                {
                    "execution_id": execution_id,
                    "worker_id": worker_id,
                    "expires_at": new_expires_at,
                },
            )

            renewed = result.rowcount > 0

            if renewed:
                logger.info(
                    "[LockManager] Lock renewed execution_id=%s worker_id=%s expires_at=%s",
                    execution_id,
                    worker_id,
                    new_expires_at,
                )
            else:
                logger.warning(
                    "[LockManager] Lock renew skipped execution_id=%s worker_id=%s",
                    execution_id,
                    worker_id,
                )

            return renewed

        except SQLAlchemyError as exc:
            logger.exception(
                "[LockManager] Failed to renew lock execution_id=%s worker_id=%s error=%s",
                execution_id,
                worker_id,
                str(exc),
            )
            raise

    # =========================================================
    # LOOKUP / VALIDATION
    # =========================================================

    def is_lock_owned_by(
        self,
        session,
        execution_id: str | uuid.UUID,
        worker_id: str,
    ) -> bool:
        """
        Check whether the given worker currently owns the lock.
        """
        execution_id = str(execution_id)

        row = session.execute(
            text("""
                SELECT 1
                FROM execution_locks
                WHERE execution_id = :execution_id
                  AND step_execution_id IS NULL
                  AND locked_by = :worker_id
                  AND expires_at > NOW()
                LIMIT 1
            """),
            {
                "execution_id": execution_id,
                "worker_id": worker_id,
            },
        ).first()

        return row is not None

    def get_lock_info(
        self,
        session,
        execution_id: str | uuid.UUID,
    ):
        """
        Fetch current lock metadata for debugging / observability.
        """
        execution_id = str(execution_id)

        return session.execute(
            text("""
                SELECT
                    lock_id,
                    execution_id,
                    lock_type,
                    locked_by,
                    expires_at,
                    created_at
                FROM execution_locks
                WHERE execution_id = :execution_id
                                    AND step_execution_id IS NULL
                LIMIT 1
            """),
            {"execution_id": execution_id},
        ).mappings().first()

    # =========================================================
    # CLEANUP
    # =========================================================

    def cleanup_expired_locks(self, session) -> int:
        """
        Delete expired locks.

        Returns:
            number of deleted rows
        """
        try:
            result = session.execute(
                text("""
                    DELETE FROM execution_locks
                    WHERE expires_at < NOW()
                      AND step_execution_id IS NULL
                """)
            )

            deleted_count = result.rowcount or 0

            if deleted_count > 0:
                logger.info(
                    "[LockManager] Cleaned expired locks count=%s",
                    deleted_count,
                )

            return deleted_count

        except SQLAlchemyError as exc:
            logger.exception(
                "[LockManager] Failed to cleanup expired locks error=%s",
                str(exc),
            )
            raise

    # =========================================================
    # INTERNAL
    # =========================================================

    def _utc_now(self) -> datetime:
        return datetime.now(timezone.utc)
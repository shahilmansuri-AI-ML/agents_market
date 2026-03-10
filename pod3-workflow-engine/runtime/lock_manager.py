import uuid
from datetime import datetime, timedelta
from sqlalchemy import text


class LockManager:

    def acquire_execution_lock(self, session, execution_id: uuid.UUID, worker_id: str):

        expires_at = datetime.utcnow() + timedelta(minutes=30)

        try:

            session.execute(
                text("""
                INSERT INTO execution_locks (
                    lock_id,
                    execution_id,
                    lock_type,
                    locked_by,
                    expires_at
                )
                VALUES (
                    gen_random_uuid(),
                    :execution_id,
                    'execution',
                    :worker_id,
                    :expires_at
                )
                """),
                {
                    "execution_id": execution_id,
                    "worker_id": worker_id,
                    "expires_at": expires_at
                }
            )

            return True

        except Exception:

            return False

    def release_execution_lock(self, session, execution_id):

        session.execute(
            text("""
            DELETE FROM execution_locks
            WHERE execution_id = :execution_id
            """),
            {"execution_id": execution_id}
        )

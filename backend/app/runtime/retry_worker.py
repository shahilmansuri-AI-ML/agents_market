from sqlalchemy import text
from app.database.session import SessionLocal
from app.runtime.coordinator import Coordinator


class RetryWorker:

    def __init__(self):
        self.coordinator = Coordinator()

    def process_pending_retries(self, limit=20):
        session = SessionLocal()

        try:
            rows = session.execute(
                text("""
                SELECT DISTINCT execution_id
                FROM execution_steps
                WHERE status = 'RETRYING'
                  AND next_retry_at IS NOT NULL
                  AND next_retry_at <= NOW()
                ORDER BY next_retry_at ASC
                LIMIT :limit
                """),
                {"limit": limit}
            ).fetchall()

            execution_ids = [str(row[0]) for row in rows]
            session.close()

            results = []
            for execution_id in execution_ids:
                try:
                    result = self.coordinator.execute(execution_id)
                    results.append({
                        "execution_id": execution_id,
                        "result": result
                    })
                except Exception as e:
                    results.append({
                        "execution_id": execution_id,
                        "error": str(e)
                    })

            return results

        finally:
            session.close()
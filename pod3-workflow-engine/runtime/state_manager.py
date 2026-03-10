import json
from sqlalchemy import text


class StateManager:

    def initialize_state(self, session, execution_id):

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
                '{}',
                NULL,
                1,
                NOW()
            )
            ON CONFLICT (execution_id)
            DO NOTHING
            """),
            {"execution_id": execution_id}
        )

    def update_state(self, session, execution_id, state, step_key):

        session.execute(
            text("""
            UPDATE execution_state
            SET state_snapshot = :state,
                last_completed_step_key = :step_key,
                version = version + 1,
                updated_at = NOW()
            WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "state": json.dumps(state),
                "step_key": step_key
            }
        )

    def write_event(self, session, execution_id, step_execution_id, event_type, payload):

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
                gen_random_uuid(),
                :execution_id,
                :step_execution_id,
                :event_type,
                'executor',
                :payload,
                NOW()
            )
            """),
            {
                "execution_id": execution_id,
                "step_execution_id": step_execution_id,
                "event_type": event_type,
                "payload": json.dumps(payload)
            }
        )

import json
from sqlalchemy import text
from app.database import SessionLocal
from runtime.lock_manager import LockManager
from runtime.state_manager import StateManager
from runtime.step_executor import StepExecutor

class Coordinator:

    def __init__(self):

        self.lock_manager = LockManager()
        self.state_manager = StateManager()
        self.step_executor = StepExecutor()

    def execute(self, execution_id: str):

        session = SessionLocal()

        try:

            # ------------------------------------
            # Load execution
            # ------------------------------------
            execution = session.execute(
                text("""
                SELECT *
                FROM executions
                WHERE execution_id = :execution_id
                """),
                {"execution_id": execution_id}
            ).mappings().first()

            if not execution:
                raise Exception("Execution not found")

            input_payload = execution["input_payload"]

            if isinstance(input_payload, str):
                input_payload = json.loads(input_payload)

            # ------------------------------------
            # Load agent metadata
            # ------------------------------------
            agent = session.execute(
                text("""
                SELECT *
                FROM agent_registry
                WHERE agent_id = :agent_id
                """),
                {"agent_id": execution["agent_id"]}
            ).mappings().first()

            if not agent:
                raise Exception("Agent not found")

            # ------------------------------------
            # Acquire execution lock
            # ------------------------------------
            self.lock_manager.acquire_execution_lock(
                session,
                execution_id,
                "worker-1"
            )

            # ------------------------------------
            # Initialize state
            # ------------------------------------
            self.state_manager.initialize_state(
                session,
                execution_id
            )

            # ------------------------------------
            # Mark execution as RUNNING
            # ------------------------------------
            session.execute(
                text("""
                UPDATE executions
                SET status = 'RUNNING',
                    started_at = NOW(),
                    updated_at = NOW()
                WHERE execution_id = :execution_id
                """),
                {"execution_id": execution_id}
            )

            # ------------------------------------
            # Write EXECUTION_STARTED event
            # ------------------------------------
            self.state_manager.write_event(
                session,
                execution_id,
                None,
                "EXECUTION_STARTED",
                {
                    "agent_id": str(agent["agent_id"])
                }
            )

            session.commit()

            # ------------------------------------
            # Execute step with timeout protection
            # ------------------------------------

            signal.signal(signal.SIGALRM, timeout_handler)

            # 30 second execution timeout
            signal.alarm(30)

            try:

                result = self.step_executor.execute(
                    session,
                    execution_id,
                    agent,
                    input_payload
                )

                signal.alarm(0)  # cancel timeout

            except ExecutionTimeout:

                raise Exception("Execution exceeded timeout limit (30s)")

            # ------------------------------------
            # Update execution_state
            # ------------------------------------
            self.state_manager.update_state(
                session,
                execution_id,
                result,
                "agent_execution"
            )

            # ------------------------------------
            # Write EXECUTION_COMPLETED event
            # ------------------------------------
            self.state_manager.write_event(
                session,
                execution_id,
                None,
                "EXECUTION_COMPLETED",
                result
            )

            # ------------------------------------
            # Mark execution completed
            # ------------------------------------
            session.execute(
                text("""
                UPDATE executions
                SET status = 'COMPLETED',
                    output_payload = :output,
                    completed_at = NOW(),
                    updated_at = NOW(),
                    current_step_key = 'agent_execution'
                WHERE execution_id = :execution_id
                """),
                {
                    "execution_id": execution_id,
                    "output": json.dumps(result)
                }
            )

            session.commit()

            # ------------------------------------
            # Release lock
            # ------------------------------------
            self.lock_manager.release_execution_lock(
                session,
                execution_id
            )

            session.commit()

            return result

        except Exception as e:

            session.rollback()

            # Write failure event
            self.state_manager.write_event(
                session,
                execution_id,
                None,
                "EXECUTION_FAILED",
                {
                    "error": str(e)
                }
            )

            session.execute(
                text("""
                UPDATE executions
                SET status = 'FAILED',
                    error_message = :error,
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE execution_id = :execution_id
                """),
                {
                    "execution_id": execution_id,
                    "error": str(e)
                }
            )

            session.commit()

            raise e

        finally:

            session.close()


import signal

class ExecutionTimeout(Exception):
    pass


def timeout_handler(signum, frame):
    raise ExecutionTimeout("Execution timed out")
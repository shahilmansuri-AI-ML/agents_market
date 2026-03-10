import uuid
import json
from sqlalchemy import text
from agents.ollama_agent import OllamaAgent
from runtime.state_manager import StateManager


class StepExecutor:

    def __init__(self):

        self.agent = OllamaAgent()
        self.state_manager = StateManager()

    def execute(self, session, execution_id, agent, input_payload):

        step_execution_id = str(uuid.uuid4())

        step_key = "agent_execution"

        # ------------------------------------
        # Create step record
        # ------------------------------------
        session.execute(
            text("""
            INSERT INTO execution_steps (
                step_execution_id,
                execution_id,
                step_name,
                step_key,
                step_order,
                step_type,
                status,
                input_payload,
                created_at,
                started_at,
                updated_at
            )
            VALUES (
                :step_execution_id,
                :execution_id,
                'agent_execution',
                :step_key,
                1,
                'llm',
                'RUNNING',
                :input_payload,
                NOW(),
                NOW(),
                NOW()
            )
            """),
            {
                "step_execution_id": step_execution_id,
                "execution_id": execution_id,
                "step_key": step_key,
                "input_payload": json.dumps(input_payload)
            }
        )

        # Update execution current step
        session.execute(
            text("""
            UPDATE executions
            SET current_step_key = :step_key,
                updated_at = NOW()
            WHERE execution_id = :execution_id
            """),
            {
                "execution_id": execution_id,
                "step_key": step_key
            }
        )

        # Write STEP_STARTED event
        self.state_manager.write_event(
            session,
            execution_id,
            step_execution_id,
            "STEP_STARTED",
            {"step_key": step_key}
        )

        session.commit()

        # ------------------------------------
        # Execute agent
        # ------------------------------------
        result = self.agent.run(
            agent["system_prompt"],
            agent["model_name"],
            input_payload
        )

        # ------------------------------------
        # Update step completed
        # ------------------------------------
        session.execute(
            text("""
            UPDATE execution_steps
            SET status = 'COMPLETED',
                output_payload = :output,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE step_execution_id = :step_execution_id
            """),
            {
                "step_execution_id": step_execution_id,
                "output": json.dumps(result)
            }
        )

        # Write STEP_COMPLETED event
        self.state_manager.write_event(
            session,
            execution_id,
            step_execution_id,
            "STEP_COMPLETED",
            result
        )

        session.commit()

        return result

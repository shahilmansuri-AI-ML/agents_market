from sqlalchemy import text
from app.database import SessionLocal


class DeploymentService:

    def deploy_agent(self, agent_id: str, tenant_id: str):

        session = SessionLocal()

        try:

            # STEP 1: Load agent
            agent = session.execute(
                text("""
                SELECT *
                FROM agent_registry
                WHERE agent_id = :agent_id
                AND tenant_id = :tenant_id
                """),
                {
                    "agent_id": agent_id,
                    "tenant_id": tenant_id
                }
            ).mappings().first()

            if not agent:
                raise Exception("Agent not found")


            # STEP 2: Check current status
            if agent["status"] == "DEPLOYED":
                return {
                    "status": "already_deployed",
                    "agent_id": agent_id
                }


            # STEP 3: Validate workflow_definition
            workflow = agent["workflow_definition"]

            if not workflow:
                raise Exception("workflow_definition missing")

            if "steps" not in workflow:
                raise Exception("Invalid workflow_definition")


            # STEP 4: Activate agent
            session.execute(
                text("""
                UPDATE agent_registry
                SET status = 'DEPLOYED',
                    updated_at = NOW()
                WHERE agent_id = :agent_id
                """),
                {
                    "agent_id": agent_id
                }
            )


            session.commit()


            return {
                "status": "deployed",
                "agent_id": agent_id
            }


        except Exception as e:

            session.rollback()
            raise e

        finally:

            session.close()
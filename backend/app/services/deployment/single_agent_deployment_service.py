from app.database.session import SessionLocal
from app.repositories.deployment_repository import DeploymentRepository
from datetime import datetime, timezone


class SingleAgentDeploymentService:
    """
    Production-level deployment service for single agents.
    """

    def __init__(self):
        self.repo = DeploymentRepository()

    def deploy(self, agent_id: str, tenant_id: str):
        session = SessionLocal()

        try:
            # 1. Load + validate agent
            agent = self.repo.get_single_agent(session, agent_id, tenant_id)
            if not agent:
                raise ValueError("Single agent not found")

            self._validate_agent(agent)

            # 2. Idempotency check
            existing_deployment = self.repo.get_active_single_deployment(session, agent_id, tenant_id)
            if existing_deployment:
                return self._build_response(
                    status="already_deployed",
                    deployment_id=str(existing_deployment),
                    agent_id=agent_id,
                    message="Single agent is already deployed"
                )

            # 3. Load dependencies
            tools = self.repo.get_agent_tools(session, agent_id)
            llm_model = self.repo.get_llm_model(session, agent["llm_model_id"])

            # 4. Build snapshot
            snapshot = self._build_snapshot(agent, tools, llm_model)

            # 5. Reuse latest deployment row if present, else create a new one.
            latest_deployment = self.repo.get_latest_single_deployment(session, agent_id, tenant_id)
            if latest_deployment:
                deployment_id = self.repo.reactivate_single_deployment(
                    session=session,
                    deployment_id=str(latest_deployment["id"]),
                    snapshot=snapshot
                )
            else:
                deployment_id = self.repo.create_single_deployment(
                    session=session,
                    tenant_id=tenant_id,
                    agent_id=agent_id,
                    snapshot=snapshot
                )

            # 6. Update status
            self.repo.mark_single_agent_as_deployed(session, agent_id, tenant_id)

            session.commit()

            return self._build_response(
                status="deployed",
                deployment_id=str(deployment_id),
                agent_id=agent_id,
                message="Single agent deployed successfully"
            )

        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def _validate_agent(self, agent):
        if not agent["name"] or not agent["instruction"]:
            raise ValueError(
                "Agent is incomplete. Name and instruction are required before deployment."
            )

    def _build_snapshot(self, agent, tools, llm_model):
        deployed_at = datetime.now(timezone.utc).isoformat()
        selected_tool = next(
            (t for t in tools if t["tool_id"] == agent["tool_id"]),
            None
        )

        return {
            "deployment_version": 1,
            "deployment_source": "manual",
            "deployed_at": deployed_at,
            "agent_type": "single",
            "type": "single_agent",
            "agent": {
                "id": str(agent["id"]),
                "tenant_id": str(agent["tenant_id"]),
                "name": agent["name"],
                "description": agent["description"],
                "instruction": agent["instruction"],
                "status": agent["status"],
                "tool_id": agent["tool_id"],
                "llm_model_id": str(agent["llm_model_id"]) if agent["llm_model_id"] else None,
                "agent_type": agent["agent_type"] if agent["agent_type"] else "single",
                "created_at": str(agent["created_at"]) if agent["created_at"] else None,
                "updated_at": str(agent["updated_at"]) if agent["updated_at"] else None
            },
            "tools": [
                {
                    "tool_id": t["tool_id"],
                    "tool_name": t["tool_name"],
                    "tool_api": t["tool_api"],
                    "config_json": t["config_json"]
                }
                for t in tools
            ],
            "selected_tool": {
                "tool_id": selected_tool["tool_id"],
                "tool_name": selected_tool["tool_name"],
                "tool_api": selected_tool["tool_api"],
                "config_json": selected_tool["config_json"]
            } if selected_tool else None,
            "llm_model": {
                "id": str(llm_model["id"]),
                "provider": llm_model["provider"],
                "model_name": llm_model["model_name"],
                "config_json": llm_model["config_json"]
            } if llm_model else None
        }

    def _build_response(self, status: str, deployment_id: str, agent_id: str, message: str):
        return {
            "status": status,
            "deployment_id": deployment_id,
            "agent_type": "single",
            "agent_id": agent_id,
            "message": message
        }
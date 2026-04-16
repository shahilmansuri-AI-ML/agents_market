from sqlalchemy import text
import json
from datetime import datetime, timezone


class DeploymentRepository:
    """
    Repository for all deployment-related DB operations.
    Keeps SQL isolated from services.
    """

    # =========================================================
    # SINGLE AGENT
    # =========================================================

    def get_single_agent(self, session, agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    tenant_id,
                    name,
                    description,
                    instruction,
                    status,
                    llm_model_id,
                    tool_id,
                    agent_type,
                    created_at,
                    updated_at
                FROM single_agents
                WHERE id = :agent_id
                  AND tenant_id = :tenant_id
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_active_single_deployment(self, session, agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT id
                FROM deployments
                WHERE agent_id = :agent_id
                  AND tenant_id = :tenant_id
                  AND status = 'ACTIVE'
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).scalar()

    def get_latest_single_deployment(self, session, agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    status
                FROM deployments
                WHERE agent_id = :agent_id
                  AND tenant_id = :tenant_id
                  AND agent_type = 'single'
                ORDER BY updated_at DESC, created_at DESC
                LIMIT 1
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_agent_tools(self, session, agent_id: str):
        return session.execute(
            text("""
                WITH linked_tools AS (
                    SELECT
                        at.tool_id,
                        at.config_json
                    FROM agent_tools at
                    WHERE at.agent_id = :agent_id

                    UNION ALL

                    SELECT
                        sa.tool_id,
                        NULL::jsonb AS config_json
                    FROM single_agents sa
                    WHERE sa.id = :agent_id
                      AND sa.tool_id IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1
                          FROM agent_tools at2
                          WHERE at2.agent_id = sa.id
                      )
                )
                SELECT
                    t.tool_id,
                    t.tool_name,
                    t.tool_api,
                    CASE
                        WHEN linked_tools.config_json IS NULL
                             OR linked_tools.config_json = '{}'::jsonb
                        THEN jsonb_build_object(
                            'tool_name', t.tool_name,
                            'tool_api', t.tool_api
                        )
                        ELSE linked_tools.config_json
                    END AS config_json
                FROM linked_tools
                JOIN tools t ON t.tool_id = linked_tools.tool_id
            """),
            {
                "agent_id": agent_id
            }
        ).mappings().all()

    def get_llm_model(self, session, llm_model_id):
        if not llm_model_id:
            return None

        return session.execute(
            text("""
                SELECT
                    id,
                    provider,
                    model_name,
                    config_json
                FROM llm_models
                WHERE id = :model_id
            """),
            {
                "model_id": llm_model_id
            }
        ).mappings().first()

    def create_single_deployment(self, session, tenant_id: str, agent_id: str, snapshot: dict):
        return session.execute(
            text("""
                INSERT INTO deployments (
                    tenant_id,
                    agent_id,
                    agent_type,
                    status,
                    deployment_type,
                    config_snapshot,
                    created_at,
                    updated_at
                )
                VALUES (
                    :tenant_id,
                    :agent_id,
                    'single',
                    'ACTIVE',
                    'manual',
                    CAST(:snapshot AS JSONB),
                    NOW(),
                    NOW()
                )
                RETURNING id
            """),
            {
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "snapshot": json.dumps(snapshot, default=str)
            }
        ).scalar()

    def reactivate_single_deployment(self, session, deployment_id: str, snapshot: dict):
        return session.execute(
            text("""
                UPDATE deployments
                SET status = 'ACTIVE',
                    deployment_type = 'redeploy',
                    config_snapshot = CAST(:snapshot AS JSONB),
                    updated_at = NOW()
                WHERE id = :deployment_id
                RETURNING id
            """),
            {
                "deployment_id": deployment_id,
                "snapshot": json.dumps(snapshot, default=str)
            }
        ).scalar()

    def mark_single_agent_as_deployed(self, session, agent_id: str, tenant_id: str):
        session.execute(
            text("""
                UPDATE single_agents
                SET status = 'DEPLOYED',
                    updated_at = NOW()
                WHERE id = :agent_id
                  AND tenant_id = :tenant_id
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        )

    # =========================================================
    # MULTI AGENT
    # =========================================================

    def get_multi_agent(self, session, multi_agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    tenant_id,
                    name,
                    description,
                    status,
                    agent_type,
                    created_at,
                    updated_at
                FROM multi_agents
                WHERE id = :multi_agent_id
                  AND tenant_id = :tenant_id
            """),
            {
                "multi_agent_id": multi_agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_active_multi_deployment(self, session, multi_agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT id
                FROM deployments
                WHERE multi_agent_id = :multi_agent_id
                  AND tenant_id = :tenant_id
                  AND status = 'ACTIVE'
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id,
                "tenant_id": tenant_id
            }
        ).scalar()

    def get_latest_multi_deployment(self, session, multi_agent_id: str, tenant_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    status
                FROM deployments
                WHERE multi_agent_id = :multi_agent_id
                  AND tenant_id = :tenant_id
                  AND agent_type = 'multi'
                ORDER BY updated_at DESC, created_at DESC
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

    def get_latest_agent_version(self, session, multi_agent_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    version,
                    json_spec,
                    created_at
                FROM agent_versions
                WHERE multi_agent_id = :multi_agent_id
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id
            }
        ).mappings().first()

    def create_agent_version(self, session, multi_agent: dict, workflow: dict, workflow_json: dict):
        version_string = "1.0.0"

        json_spec = {
            "multi_agent": {
                "id": str(multi_agent["id"]),
                "tenant_id": str(multi_agent["tenant_id"]),
                "name": multi_agent["name"],
                "description": multi_agent["description"],
                "status": multi_agent["status"],
                "agent_type": multi_agent["agent_type"] if multi_agent["agent_type"] else "multi",
            },
            "workflow": {
                "id": str(workflow["id"]),
                "name": workflow["name"],
                "description": workflow["description"],
                "nodes": workflow_json.get("nodes", []),
                "edges": workflow_json.get("edges", []),
            }
        }

        version_id = session.execute(
            text("""
                INSERT INTO agent_versions (
                    multi_agent_id,
                    version,
                    json_spec,
                    created_at
                )
                VALUES (
                    :multi_agent_id,
                    :version,
                    CAST(:json_spec AS JSONB),
                    NOW()
                )
                RETURNING id
            """),
            {
                "multi_agent_id": str(multi_agent["id"]),
                "version": version_string,
                "json_spec": json.dumps(json_spec, default=str)
            }
        ).scalar()

        return {
            "id": version_id,
            "version": version_string,
            "json_spec": json_spec,
            "created_at": datetime.now(timezone.utc)
        }

    def get_workflow(self, session, multi_agent_id: str):
        return session.execute(
            text("""
                SELECT
                    id,
                    name,
                    description,
                    workflow_json,
                    created_at,
                    updated_at
                FROM workflows
                WHERE multi_agent_id = :multi_agent_id
                LIMIT 1
            """),
            {
                "multi_agent_id": multi_agent_id
            }
        ).mappings().first()

    def create_multi_deployment(
        self,
        session,
        tenant_id: str,
        multi_agent_id: str,
        agent_version_id: str,
        snapshot: dict
    ):
        return session.execute(
            text("""
                INSERT INTO deployments (
                    tenant_id,
                    multi_agent_id,
                    agent_type,
                    agent_version_id,
                    status,
                    deployment_type,
                    config_snapshot,
                    created_at,
                    updated_at
                )
                VALUES (
                    :tenant_id,
                    :multi_agent_id,
                    'multi',
                    :agent_version_id,
                    'ACTIVE',
                    'manual',
                    CAST(:snapshot AS JSONB),
                    NOW(),
                    NOW()
                )
                RETURNING id
            """),
            {
                "tenant_id": tenant_id,
                "multi_agent_id": multi_agent_id,
                "agent_version_id": agent_version_id,
                "snapshot": json.dumps(snapshot, default=str)
            }
        ).scalar()

    def reactivate_multi_deployment(
        self,
        session,
        deployment_id: str,
        agent_version_id: str,
        snapshot: dict
    ):
        return session.execute(
            text("""
                UPDATE deployments
                SET status = 'ACTIVE',
                    deployment_type = 'redeploy',
                    agent_version_id = :agent_version_id,
                    config_snapshot = CAST(:snapshot AS JSONB),
                    updated_at = NOW()
                WHERE id = :deployment_id
                RETURNING id
            """),
            {
                "deployment_id": deployment_id,
                "agent_version_id": agent_version_id,
                "snapshot": json.dumps(snapshot, default=str)
            }
        ).scalar()

    def mark_multi_agent_as_deployed(self, session, multi_agent_id: str, tenant_id: str):
        session.execute(
            text("""
                UPDATE multi_agents
                SET status = 'DEPLOYED',
                    updated_at = NOW()
                WHERE id = :multi_agent_id
                  AND tenant_id = :tenant_id
            """),
            {
                "multi_agent_id": multi_agent_id,
                "tenant_id": tenant_id
            }
        )

    # =========================================================
    # NODES & EDGES
    # =========================================================

    def _normalize_node_type(self, frontend_type: str) -> str:
        """
        Map frontend node type names to DB CHECK constraint values:
        LLM, TOOL, CONDITION, INPUT, OUTPUT
        """
        mapping = {
            "STARTNODE": "INPUT",
            "ENDNODE":   "OUTPUT",
            "AGENTNODE": "LLM",
            "APINODE":   "TOOL",
            "TOOLNODE":  "TOOL",
            "IFELSENODE": "CONDITION",
            # plain variants (in case frontend sends normalised strings)
            "INPUT":     "INPUT",
            "OUTPUT":    "OUTPUT",
            "LLM":       "LLM",
            "TOOL":      "TOOL",
            "CONDITION": "CONDITION",
        }
        return mapping.get(frontend_type.strip().upper(), "LLM")

    def create_agent_nodes(
        self,
        session,
        agent_version_id: str,
        multi_agent_id: str,
        nodes: list
    ) -> dict:
        """
        Insert all nodes from workflow JSON into agent_nodes table.

        Also attempts to resolve the linked single_agent id for AgentNode types
        so that agent_nodes.agent_id is populated correctly.

        Returns:
            node_id_map  –  { frontend_node_id: db_uuid_str }
        """
        node_id_map: dict[str, str] = {}

        for node in nodes:
            frontend_id  = node.get("id")
            frontend_type = node.get("type", "UNKNOWN")
            normalized_type = self._normalize_node_type(frontend_type)

            data   = node.get("data", {})
            config = data.get("config", {})
            name   = data.get("label") or frontend_id

            # Try to pull the linked single-agent UUID for AgentNode rows
            agent_id: str | None = None
            if normalized_type == "LLM":
                agent_id = (
                    config.get("agent_id")
                    or config.get("agentId")
                    or data.get("agent_id")
                    or data.get("agentId")
                )

            db_id = session.execute(
                text("""
                    INSERT INTO agent_nodes (
                        agent_version_id,
                        multi_agent_id,
                        agent_id,
                        node_type,
                        name,
                        config,
                        created_at
                    )
                    VALUES (
                        :agent_version_id,
                        :multi_agent_id,
                        :agent_id,
                        :node_type,
                        :name,
                        CAST(:config AS JSONB),
                        NOW()
                    )
                    RETURNING id
                """),
                {
                    "agent_version_id": agent_version_id,
                    "multi_agent_id":   multi_agent_id,
                    "agent_id":         agent_id,          # NULL for non-agent nodes
                    "node_type":        normalized_type,
                    "name":             name,
                    "config":           json.dumps(data, default=str)
                }
            ).scalar()

            node_id_map[frontend_id] = str(db_id)

        return node_id_map

    def create_agent_edges(
        self,
        session,
        agent_version_id: str,
        edges: list,
        node_id_map: dict
    ) -> None:
        """
        Insert all edges from workflow JSON into agent_edges table.
        Uses node_id_map to resolve frontend node IDs → DB UUIDs.

        sourceHandle values:
            "true"  → true branch  of an IfElse  (CONDITIONAL)
            "false" → false branch of an IfElse  (CONDITIONAL)
            None    → regular edge               (NORMAL)
        """
        for edge in edges:
            frontend_source = edge.get("source")
            frontend_target = edge.get("target")

            db_source = node_id_map.get(frontend_source)
            db_target = node_id_map.get(frontend_target)

            if not db_source:
                raise ValueError(
                    f"Edge '{edge.get('id')}': source node '{frontend_source}' "
                    f"not found in node_id_map"
                )
            if not db_target:
                raise ValueError(
                    f"Edge '{edge.get('id')}': target node '{frontend_target}' "
                    f"not found in node_id_map"
                )

            source_handle = edge.get("sourceHandle")

            if source_handle in ("true", "false"):
                edge_type = "CONDITIONAL"
                condition  = json.dumps({"branch": source_handle})
            else:
                edge_type = "NORMAL"
                condition  = None

            session.execute(
                text("""
                    INSERT INTO agent_edges (
                        agent_version_id,
                        source_node_id,
                        target_node_id,
                        edge_type,
                        condition,
                        created_at
                    )
                    VALUES (
                        :agent_version_id,
                        :source_node_id,
                        :target_node_id,
                        :edge_type,
                        CAST(:condition AS JSONB),
                        NOW()
                    )
                """),
                {
                    "agent_version_id": agent_version_id,
                    "source_node_id":   db_source,
                    "target_node_id":   db_target,
                    "edge_type":        edge_type,
                    "condition":        condition
                }
            )
            
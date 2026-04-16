

from app.database.session import SessionLocal
from app.repositories.deployment_repository import DeploymentRepository
from datetime import datetime, timezone


class MultiAgentDeploymentService:
    """
    Production-level deployment service for multi-agents.
    """

    def __init__(self):
        self.repo = DeploymentRepository()

    def deploy(self, multi_agent_id: str, tenant_id: str):
        session = SessionLocal()

        try:
            # 1. Load + validate multi-agent
            multi_agent = self.repo.get_multi_agent(session, multi_agent_id, tenant_id)
            if not multi_agent:
                raise ValueError("Multi-agent not found")

            self._validate_multi_agent(multi_agent)

            # 2. Idempotency check
            existing_deployment = self.repo.get_active_multi_deployment(session, multi_agent_id, tenant_id)
            if existing_deployment:
                return self._build_response(
                    status="already_deployed",
                    deployment_id=str(existing_deployment),
                    multi_agent_id=multi_agent_id,
                    message="Multi-agent is already deployed"
                )

            # 3. Load workflow
            workflow = self.repo.get_workflow(session, multi_agent_id)
            if not workflow:
                raise ValueError("Workflow not found for this multi-agent")

            workflow_json = workflow["workflow_json"] or {"nodes": [], "edges": []}
            nodes = workflow_json.get("nodes", [])
            edges = workflow_json.get("edges", [])

            # 4. Validate graph
            self._validate_multi_agent_graph(nodes, edges)

            # 5. Get latest version OR auto-create
            version = self.repo.get_latest_agent_version(session, multi_agent_id)
            if not version:
                version = self.repo.create_agent_version(session, multi_agent, workflow, workflow_json)

            # 6. Build snapshot
            snapshot = self._build_snapshot(
                multi_agent=multi_agent,
                workflow=workflow,
                workflow_json=workflow_json,
                version=version,
                nodes=nodes,
                edges=edges
            )

            # 7. Reuse latest deployment row if present, else create a new one.
            latest_deployment = self.repo.get_latest_multi_deployment(session, multi_agent_id, tenant_id)
            if latest_deployment:
                deployment_id = self.repo.reactivate_multi_deployment(
                    session=session,
                    deployment_id=str(latest_deployment["id"]),
                    agent_version_id=str(version["id"]),
                    snapshot=snapshot
                )
            else:
                deployment_id = self.repo.create_multi_deployment(
                    session=session,
                    tenant_id=tenant_id,
                    multi_agent_id=multi_agent_id,
                    agent_version_id=str(version["id"]),
                    snapshot=snapshot
                )

            # 7b. Persist nodes into agent_nodes table
            #     Returns { frontend_node_id → db_uuid } mapping needed for edges
            node_id_map = self.repo.create_agent_nodes(
                session=session,
                agent_version_id=str(version["id"]),
                multi_agent_id=multi_agent_id,
                nodes=nodes
            )

            # 7c. Persist edges into agent_edges table
            #     Resolves frontend IDs to real DB UUIDs via node_id_map
            self.repo.create_agent_edges(
                session=session,
                agent_version_id=str(version["id"]),
                edges=edges,
                node_id_map=node_id_map
            )

            # 8. Update multi-agent status to DEPLOYED
            self.repo.mark_multi_agent_as_deployed(session, multi_agent_id, tenant_id)

            session.commit()

            return self._build_response(
                status="deployed",
                deployment_id=str(deployment_id),
                multi_agent_id=multi_agent_id,
                workflow_id=str(workflow["id"]),
                agent_version_id=str(version["id"]),
                nodes_count=len(nodes),
                edges_count=len(edges),
                message="Multi-agent deployed successfully"
            )

        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # -------------------------------------------------------
    # Validators
    # -------------------------------------------------------

    def _validate_multi_agent(self, multi_agent):
        if not multi_agent["name"]:
            raise ValueError("Multi-agent is incomplete. Name is required before deployment.")

    def _validate_multi_agent_graph(self, nodes, edges):
        if not nodes:
            raise ValueError("Workflow has no nodes")

        node_ids = {str(n.get("id")) for n in nodes if n.get("id")}
        if not node_ids:
            raise ValueError("Workflow has invalid nodes")

        adjacency = {node_id: [] for node_id in node_ids}
        reverse_adjacency = {node_id: [] for node_id in node_ids}

        # ── Edge connectivity ──────────────────────────────
        for e in edges:
            source = str(e.get("source"))
            target = str(e.get("target"))

            if source not in node_ids:
                raise ValueError(f"Invalid edge: source node '{source}' not found")
            if target not in node_ids:
                raise ValueError(f"Invalid edge: target node '{target}' not found")

            adjacency[source].append(target)
            reverse_adjacency[target].append(source)

        # ── INPUT node validation ──────────────────────────
        # Accept both frontend names ("StartNode") and normalised DB names ("INPUT")
        INPUT_TYPES = {"STARTNODE", "INPUT"}
        OUTPUT_TYPES = {"ENDNODE", "OUTPUT"}

        input_nodes = [
            n for n in nodes
            if str(n.get("type", "")).strip().upper() in INPUT_TYPES
        ]
        if not input_nodes:
            raise ValueError("Workflow must contain at least one Start (INPUT) node")

        # ── OUTPUT node validation ─────────────────────────
        output_nodes = [
            n for n in nodes
            if str(n.get("type", "")).strip().upper() in OUTPUT_TYPES
        ]
        if not output_nodes:
            raise ValueError("Workflow must contain at least one End (OUTPUT) node")

        outgoing_sources = {str(e.get("source")) for e in edges}

        # Every INPUT node must have at least one outgoing edge
        for input_node in input_nodes:
            if str(input_node.get("id")) not in outgoing_sources:
                raise ValueError(
                    f"Start node '{input_node.get('data', {}).get('label', input_node.get('id'))}' "
                    f"has no outgoing edge"
                )

        # OUTPUT nodes must NOT have outgoing edges
        for output_node in output_nodes:
            if str(output_node.get("id")) in outgoing_sources:
                raise ValueError(
                    f"End node '{output_node.get('data', {}).get('label', output_node.get('id'))}' "
                    f"should not have outgoing edges"
                )

        # Non-output nodes should not terminate unexpectedly.
        output_node_ids = {str(node.get("id")) for node in output_nodes}
        for node in nodes:
            node_id = str(node.get("id"))
            if node_id in output_node_ids:
                continue
            if not adjacency.get(node_id):
                raise ValueError(
                    f"Node '{node.get('data', {}).get('label', node_id)}' has no outgoing edge"
                )

        # Every node should be reachable from at least one INPUT node.
        start_ids = [str(node.get("id")) for node in input_nodes]
        visited = set()
        stack = list(start_ids)
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            stack.extend(adjacency.get(current, []))

        unreachable = node_ids - visited
        if unreachable:
            raise ValueError(
                f"Workflow contains unreachable nodes: {', '.join(sorted(unreachable))}"
            )

        # At least one OUTPUT node must be reachable.
        if not any(output_id in visited for output_id in output_node_ids):
            raise ValueError("Workflow has no executable path from Start to End node")

        # Prevent cycles to avoid runaway executions in production.
        in_degree = {node_id: len(reverse_adjacency[node_id]) for node_id in node_ids}
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        processed = 0

        while queue:
            current = queue.pop(0)
            processed += 1
            for neighbor in adjacency.get(current, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if processed != len(node_ids):
            raise ValueError("Workflow contains cycles. Please remove looped edges before deployment.")

    # -------------------------------------------------------
    # Snapshot builder
    # -------------------------------------------------------

    def _build_snapshot(self, multi_agent, workflow, workflow_json, version, nodes, edges):
        deployed_at = datetime.now(timezone.utc).isoformat()

        return {
            "deployment_version": 1,
            "deployment_source": "manual",
            "deployed_at": deployed_at,
            "agent_type": "multi",
            "type": "multi_agent",
            "runtime": {
                "provider": "langgraph",
                "llm_stack": "langchain",
                "protocol": "a2a",
                "protocol_version": "1.0"
            },

            "multi_agent": {
                "id": str(multi_agent["id"]),
                "tenant_id": str(multi_agent["tenant_id"]),
                "name": multi_agent["name"],
                "description": multi_agent["description"],
                "status": multi_agent["status"],
                "agent_type": multi_agent["agent_type"] if multi_agent["agent_type"] else "multi",
                "created_at": str(multi_agent["created_at"]) if multi_agent["created_at"] else None,
                "updated_at": str(multi_agent["updated_at"]) if multi_agent["updated_at"] else None
            },

            "workflow": {
                "id": str(workflow["id"]),
                "name": workflow["name"],
                "description": workflow["description"],
                "workflow_json": workflow_json
            },

            "version": {
                "id": str(version["id"]),
                "version": version["version"],
                "json_spec": version["json_spec"],
                "created_at": str(version["created_at"]) if version["created_at"] else None
            },

            "nodes": nodes,
            "edges": edges
        }

    # -------------------------------------------------------
    # Response builder
    # -------------------------------------------------------

    def _build_response(
        self,
        status: str,
        deployment_id: str,
        multi_agent_id: str,
        workflow_id: str = None,
        agent_version_id: str = None,
        nodes_count: int = 0,
        edges_count: int = 0,
        message: str = ""
    ):
        return {
            "status": status,
            "deployment_id": deployment_id,
            "agent_type": "multi",
            "agent_id": multi_agent_id,
            "workflow_id": workflow_id,
            "agent_version_id": agent_version_id,
            "nodes_count": nodes_count,
            "edges_count": edges_count,
            "message": message
        }
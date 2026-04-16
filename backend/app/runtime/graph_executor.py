import uuid
import logging
from typing import Any, Dict, List, Optional

from app.adapters.langgraph_adapter import LangGraphAdapter
from app.runtime.a2a_protocol import build_a2a_handoff
from app.runtime.nodes.node_registry import NodeRegistry
from app.runtime.nodes.llm_node import LLMNodeExecutor
from app.runtime.nodes.tool_node import ToolNodeExecutor
from app.runtime.nodes.condition_node import ConditionNodeExecutor
from app.runtime.step_lifecycle_manager import StepLifecycleManager
from app.runtime.event_manager import EventManager
from app.runtime.errors import RetryableStepError


logger = logging.getLogger(__name__)


class GraphExecutor:
    """
    Executes multi-agent workflow graphs using LangGraph runtime.

    Safe production upgrade:
    - keeps current behavior intact
    - adds validation, logging, and runtime guardrails
    """

    def __init__(self):
        self.registry = NodeRegistry()
        self.step_manager = StepLifecycleManager()
        self.event_manager = EventManager()
        self.langgraph = LangGraphAdapter()
        self._runtime_context = {}

        # Register supported node executors
        self.registry.register("LLM", LLMNodeExecutor())
        self.registry.register("TOOL", ToolNodeExecutor())
        self.registry.register("CONDITION", ConditionNodeExecutor())

    # =========================================================
    # MAIN EXECUTION
    # =========================================================

    def execute(self, session, execution_id, snapshot, input_payload):
        logger.info("[GraphExecutor] START execution_id=%s", execution_id)

        nodes = snapshot.get("nodes", []) or []
        edges = snapshot.get("edges", []) or []

        if not isinstance(nodes, list):
            raise ValueError("Workflow snapshot 'nodes' must be a list")

        if not isinstance(edges, list):
            raise ValueError("Workflow snapshot 'edges' must be a list")

        node_map = {
            str(n["id"]): n
            for n in nodes
            if isinstance(n, dict) and n.get("id") is not None
        }

        if not node_map:
            raise ValueError("Workflow contains no valid nodes")

        current_node = next((n for n in nodes if self._node_type(n) == "INPUT"), None)
        if not current_node:
            raise ValueError("Workflow must contain an INPUT node")

        trace_id = str(uuid.uuid4())

        self._runtime_context = {
            "session": session,
            "execution_id": execution_id,
            "node_map": node_map,
            "edges": edges,
            "trace_id": trace_id,
        }

        logger.info(
            "[GraphExecutor] execution_id=%s nodes=%s edges=%s start_node=%s trace_id=%s",
            execution_id,
            len(nodes),
            len(edges),
            str(current_node.get("id")),
            trace_id,
        )

        compiled_graph = self.langgraph.compile_workflow(
            nodes=nodes,
            edges=edges,
            start_node_id=str(current_node["id"]),
            node_runner=self._run_node,
            route_runner=self._resolve_route,
        )

        final_state = self.langgraph.invoke(
            compiled_graph,
            {
                "current_payload": input_payload,
                "last_output": input_payload,
                "step_order": 0,
                "a2a_messages": [],
            },
        )

        output = final_state.get("last_output") or {"text": "Execution finished"}

        if isinstance(output, dict):
            output.setdefault("meta", {})
            output["meta"]["a2a_protocol"] = "a2a/1.0"
            output["meta"]["a2a_message_count"] = len(final_state.get("a2a_messages", []))
            output["a2a_messages"] = final_state.get("a2a_messages", [])

        logger.info("[GraphExecutor] SUCCESS execution_id=%s", execution_id)
        return output

    # =========================================================
    # NODE RUNNER
    # =========================================================

    def _run_node(self, node_id, state):
        session = self._runtime_context["session"]
        execution_id = self._runtime_context["execution_id"]
        node_map = self._runtime_context["node_map"]
        edges = self._runtime_context["edges"]
        trace_id = self._runtime_context["trace_id"]

        current_node = node_map.get(str(node_id))
        if not current_node:
            raise ValueError(f"Node not found in workflow: {node_id}")

        current_input = state.get("current_payload", {})
        step_order = int(state.get("step_order", 0)) + 1

        logger.info(
            "[GraphExecutor] STEP_START execution_id=%s node_id=%s node_type=%s step_order=%s",
            execution_id,
            str(current_node.get("id")),
            self._node_type(current_node),
            step_order,
        )

        step_id = self.step_manager.create_step(
            session, execution_id, current_node, step_order, current_input
        )

        self.event_manager.emit(
            session,
            execution_id,
            step_id,
            "STEP_STARTED",
            {"node_id": str(current_node.get("id"))},
        )
        session.flush()

        try:
            node_type = self._node_type(current_node)

            # Pass-through nodes
            if node_type in ("INPUT", "OUTPUT"):
                output = current_input

            # Pipeline halt support
            elif self._should_bypass_node(current_input):
                logger.info(
                    "[GraphExecutor] BYPASS execution_id=%s node_id=%s",
                    execution_id,
                    str(current_node.get("id")),
                )
                output = current_input

            else:
                executor = self.registry.get(node_type)
                if not executor:
                    raise ValueError(f"No executor registered for node type: {node_type}")

                agent = {}
                if node_type == "LLM":
                    node_data = current_node.get("data", {}) or {}
                    node_config = node_data.get("config", {}) or {}

                    agent = {
                        "name": node_data.get("label")
                        or current_node.get("name")
                        or "Agent",
                        "instruction": node_config.get(
                            "instruction",
                            "You are a helpful AI assistant."
                        ),
                        "llm_model": (
                            node_config.get("llm_model")
                            or node_config.get("llmModel")
                            or node_config.get("llm")
                            or node_config.get("model")
                            or "llama-3.1-8b-instant"
                        ),
                        "provider_name": node_config.get("provider"),
                        "model_api": node_config.get("api_link"),
                    }

                output = executor.execute({
                    "session": session,
                    "execution_id": execution_id,
                    "node": current_node,
                    "input": current_input,
                    "agent": agent,
                    "use_langchain": node_type == "LLM",
                    "runtime_provider": "langgraph",
                })

            self.step_manager.complete_step(session, step_id, output)

            self.event_manager.emit(
                session,
                execution_id,
                step_id,
                "STEP_COMPLETED",
                output,
            )

            session.commit()

            logger.info(
                "[GraphExecutor] STEP_SUCCESS execution_id=%s node_id=%s step_id=%s",
                execution_id,
                str(current_node.get("id")),
                str(step_id),
            )

        except Exception as e:
            logger.exception(
                "[GraphExecutor] STEP_FAILED execution_id=%s node_id=%s error=%s",
                execution_id,
                str(current_node.get("id")),
                str(e),
            )

            try:
                if isinstance(e, RetryableStepError):
                    self.step_manager.schedule_retry(session, step_id, e)
                    self.event_manager.emit(
                        session,
                        execution_id,
                        step_id,
                        "RETRY_SCHEDULED",
                        {"error": str(e), "step_id": str(step_id)},
                    )
                else:
                    self.step_manager.fail_step(session, step_id, e)
                    self.event_manager.emit(
                        session,
                        execution_id,
                        step_id,
                        "STEP_FAILED",
                        {"error": str(e)},
                    )

                session.commit()

            except Exception:
                session.rollback()
                logger.exception(
                    "[GraphExecutor] FAILURE_HANDLER_FAILED execution_id=%s step_id=%s",
                    execution_id,
                    str(step_id),
                )
                raise
            raise

            raise

        next_node_id = self._peek_next_node_id(current_node, output, edges, node_map)
        next_node = node_map.get(str(next_node_id)) if next_node_id else None

        safe_output = output if isinstance(output, dict) else {"text": str(output)}

        a2a_message = build_a2a_handoff(
            execution_id=execution_id,
            trace_id=trace_id,
            from_node_id=str(current_node.get("id")),
            to_node_id=str(next_node_id) if next_node_id else None,
            payload=safe_output,
            metadata={
                "step_execution_id": str(step_id),
                "from_node_type": self._node_type(current_node),
                "to_node_type": self._node_type(next_node) if next_node else "END",
            },
        )

        return {
            "current_payload": output,
            "last_output": output,
            "last_decision": output.get("decision") if isinstance(output, dict) else None,
            "step_order": step_order,
            "a2a_messages": [*state.get("a2a_messages", []), a2a_message],
        }

    # =========================================================
    # FLOW HELPERS
    # =========================================================

    def _should_bypass_node(self, payload):
        if not isinstance(payload, dict):
            return False

        meta = payload.get("meta")
        if not isinstance(meta, dict):
            return False

        return bool(meta.get("halt_pipeline"))

    def _resolve_route(self, node_id, state, routes):
        if not routes:
            return None

        node = self._runtime_context["node_map"].get(str(node_id))
        if not node:
            return routes[0]["route_key"]

        node_type = self._node_type(node)

        if node_type != "CONDITION":
            return routes[0]["route_key"]

        output = state.get("last_output")
        decision = output.get("decision") if isinstance(output, dict) else output

        if isinstance(decision, bool):
            desired = "true" if decision else "false"
        elif decision is None:
            desired = routes[0]["route_key"]
        else:
            decision_text = str(decision).strip().lower()
            if decision_text in ("true", "yes", "pass", "approved", "accept", "allow"):
                desired = "true"
            elif decision_text in ("false", "no", "fail", "rejected", "reject", "deny"):
                desired = "false"
            else:
                desired = decision_text

        for route in routes:
            if route.get("route_key") == desired:
                return route["route_key"]

        return routes[0]["route_key"]

    def _peek_next_node_id(self, node, output, edges, node_map):
        next_node = self._next_node(node, output, edges, node_map)
        if next_node:
            return str(next_node.get("id"))
        return None

    def _next_node(self, node, output, edges, node_map):
        node_type = self._node_type(node)
        desired_handle = None

        if node_type == "CONDITION":
            decision = output.get("decision") if isinstance(output, dict) else output
            if isinstance(decision, bool):
                desired_handle = "true" if decision else "false"
            elif decision is not None:
                decision_text = str(decision).strip().lower()
                if decision_text in ("true", "yes", "pass", "approved", "accept", "allow"):
                    desired_handle = "true"
                elif decision_text in ("false", "no", "fail", "rejected", "reject", "deny"):
                    desired_handle = "false"

        for e in edges:
            source_id = e.get("source") or e.get("source_node_id")
            target_id = e.get("target") or e.get("target_node_id")

            if str(source_id) == str(node.get("id")):
                source_handle = e.get("sourceHandle") or e.get("source_handle")
                if desired_handle and source_handle and str(source_handle).strip().lower() != desired_handle:
                    continue
                return node_map.get(str(target_id))

        if desired_handle:
            for e in edges:
                source_id = e.get("source") or e.get("source_node_id")
                target_id = e.get("target") or e.get("target_node_id")
                if str(source_id) == str(node.get("id")):
                    return node_map.get(str(target_id))

        return None

    # =========================================================
    # NODE TYPE NORMALIZATION
    # =========================================================

    def _node_type(self, node):
        if not isinstance(node, dict):
            return "LLM"

        raw_type = node.get("node_type") or node.get("type") or ""
        normalized = str(raw_type).strip().upper()

        mapping = {
            "STARTNODE": "INPUT",
            "INPUT": "INPUT",
            "ENDNODE": "OUTPUT",
            "OUTPUT": "OUTPUT",
            "AGENTNODE": "LLM",
            "LLM": "LLM",
            "APINODE": "TOOL",
            "TOOLNODE": "TOOL",
            "TOOL": "TOOL",
            "IFELSENODE": "CONDITION",
            "CONDITION": "CONDITION",
            "LOOPNODE": "CONDITION",
            "APPROVALNODE": "CONDITION",
            "OPENAINODE": "TOOL",
            "CUSTOMNODE": "TOOL",
        }

        return mapping.get(normalized, normalized or "LLM")
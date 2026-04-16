from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Tuple


logger = logging.getLogger(__name__)


class LangGraphAdapter:
    """
    Production-grade adapter around LangGraph compilation and execution.

    Responsibilities:
    - Lazy-load LangGraph dependency
    - Validate workflow structure
    - Safely compile graph
    - Provide controlled execution with limits
    - Ensure predictable routing behavior

    Behavior remains backward compatible.
    """

    DEFAULT_MAX_STEPS = 100

    # =========================================================
    # INTERNAL: LOAD DEPENDENCY
    # =========================================================
    def _load_langgraph(self):
        try:
            from langgraph.graph import StateGraph, END
            return StateGraph, END
        except ImportError as exc:
            logger.exception("[LangGraphAdapter] LangGraph import failed")
            raise RuntimeError(
                "LangGraph is not installed. Install 'langgraph' and restart the backend."
            ) from exc

    # =========================================================
    # PUBLIC: COMPILE WORKFLOW
    # =========================================================
    def compile_workflow(
        self,
        *,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        start_node_id: str,
        node_runner: Callable[[str, Dict[str, Any]], Dict[str, Any]],
        route_runner: Callable[[str, Dict[str, Any], List[Dict[str, Any]]], str],
    ):
        """
        Compile workflow into executable LangGraph.

        Args:
            nodes: Workflow nodes
            edges: Workflow edges
            start_node_id: Entry node ID
            node_runner: Function to execute nodes
            route_runner: Function to resolve conditional routes

        Returns:
            Compiled LangGraph instance
        """
        StateGraph, END = self._load_langgraph()

        self._validate_inputs(nodes, edges, start_node_id)

        graph = StateGraph(dict)

        node_ids = self._extract_node_ids(nodes)
        outgoing = self._build_outgoing_map(edges, node_ids)

        logger.info(
            "[LangGraphAdapter] Compiling workflow | nodes=%s edges=%s start=%s",
            len(node_ids),
            len(edges),
            start_node_id,
        )

        # Add nodes safely
        for node_id in node_ids:
            graph.add_node(
                node_id,
                self._safe_node_runner(node_runner, node_id),
            )

        graph.set_entry_point(str(start_node_id))

        # Add edges
        for node_id in node_ids:
            routes = outgoing.get(node_id, [])

            if not routes:
                graph.add_edge(node_id, END)
                continue

            if len(routes) == 1:
                graph.add_edge(node_id, routes[0]["target"])
                continue

            route_map = {
                route["route_key"]: route["target"]
                for route in routes
            }

            graph.add_conditional_edges(
                node_id,
                self._safe_route_runner(route_runner, node_id, routes),
                route_map,
            )

        compiled = graph.compile()

        logger.info("[LangGraphAdapter] Workflow compiled successfully")

        return compiled

    # =========================================================
    # PUBLIC: INVOKE
    # =========================================================
    def invoke(
        self,
        compiled_graph,
        initial_state: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute compiled graph with safety limits.
        """
        if not isinstance(initial_state, dict):
            raise ValueError("initial_state must be a dictionary")

        max_steps = self._resolve_max_steps(initial_state)

        logger.info(
            "[LangGraphAdapter] Invoking graph | max_steps=%s",
            max_steps,
        )

        try:
            result = compiled_graph.invoke(
                initial_state,
                config={"recursion_limit": max_steps},
            )

            if not isinstance(result, dict):
                logger.warning(
                    "[LangGraphAdapter] Unexpected result type: %s",
                    type(result),
                )
                return {"result": result}

            return result

        except Exception as error:
            logger.exception(
                "[LangGraphAdapter] Graph execution failed | error=%s",
                str(error),
            )
            raise

    # =========================================================
    # INTERNAL HELPERS
    # =========================================================

    def _validate_inputs(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        start_node_id: str,
    ) -> None:
        if not isinstance(nodes, list):
            raise ValueError("nodes must be a list")

        if not isinstance(edges, list):
            raise ValueError("edges must be a list")

        if not start_node_id:
            raise ValueError("start_node_id is required")

    def _extract_node_ids(self, nodes: List[Dict[str, Any]]) -> set[str]:
        node_ids = {
            str(node.get("id"))
            for node in nodes
            if isinstance(node, dict) and node.get("id") is not None
        }

        if not node_ids:
            raise ValueError("No valid node IDs found in workflow")

        return node_ids

    def _build_outgoing_map(
        self,
        edges: List[Dict[str, Any]],
        node_ids: set[str],
    ) -> Dict[str, List[Dict[str, Any]]]:
        outgoing: Dict[str, List[Dict[str, Any]]] = {}

        for edge in edges:
            source_id = str(edge.get("source") or edge.get("source_node_id") or "")
            target_id = str(edge.get("target") or edge.get("target_node_id") or "")

            if source_id not in node_ids or target_id not in node_ids:
                logger.warning(
                    "[LangGraphAdapter] Skipping invalid edge | source=%s target=%s",
                    source_id,
                    target_id,
                )
                continue

            route_key = str(
                edge.get("sourceHandle")
                or edge.get("source_handle")
                or target_id
            ).strip().lower()

            outgoing.setdefault(source_id, []).append(
                {
                    "target": target_id,
                    "route_key": route_key,
                    "source_handle": edge.get("sourceHandle")
                    or edge.get("source_handle"),
                }
            )

        return outgoing

    def _safe_node_runner(
        self,
        node_runner: Callable[[str, Dict[str, Any]], Dict[str, Any]],
        node_id: str,
    ) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
        """
        Wrap node runner with logging and safety.
        """
        def runner(state: Dict[str, Any]) -> Dict[str, Any]:
            try:
                return node_runner(node_id, state)
            except Exception as error:
                logger.exception(
                    "[LangGraphAdapter] Node execution failed | node_id=%s error=%s",
                    node_id,
                    str(error),
                )
                raise

        return runner

    def _safe_route_runner(
        self,
        route_runner: Callable[[str, Dict[str, Any], List[Dict[str, Any]]], str],
        node_id: str,
        routes: List[Dict[str, Any]],
    ) -> Callable[[Dict[str, Any]], str]:
        """
        Wrap route resolver with fallback safety.
        """
        def runner(state: Dict[str, Any]) -> str:
            try:
                route = route_runner(node_id, state, routes)

                if route is None:
                    return routes[0]["route_key"]

                return str(route)

            except Exception as error:
                logger.exception(
                    "[LangGraphAdapter] Route resolution failed | node_id=%s error=%s",
                    node_id,
                    str(error),
                )
                return routes[0]["route_key"]

        return runner

    def _resolve_max_steps(self, state: Dict[str, Any]) -> int:
        raw = state.get("max_steps")

        try:
            value = int(raw)
            if value <= 0:
                raise ValueError
            return value
        except Exception:
            return self.DEFAULT_MAX_STEPS

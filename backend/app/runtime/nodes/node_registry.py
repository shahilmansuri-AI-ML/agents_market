from __future__ import annotations

import logging
from typing import Any, Dict, List


logger = logging.getLogger(__name__)


class NodeRegistryError(Exception):
    """
    Base exception for NodeRegistry-related errors.
    """


class NodeExecutorNotFoundError(NodeRegistryError):
    """
    Raised when no executor is registered for a requested node type.
    """


class DuplicateNodeExecutorError(NodeRegistryError):
    """
    Raised when attempting to register a duplicate executor without override.
    """


class InvalidNodeTypeError(NodeRegistryError):
    """
    Raised when node type is invalid.
    """


class InvalidExecutorError(NodeRegistryError):
    """
    Raised when executor is invalid.
    """


class NodeRegistry:
    """
    Central registry for workflow node executors.

    Responsibilities:
    - Register executors for node types
    - Retrieve executors safely
    - Normalize node type names
    - Prevent invalid registrations
    - Provide visibility into supported node types

    """

    def __init__(self) -> None:
        self._registry: Dict[str, Any] = {}

    # =========================================================
    # PUBLIC API
    # =========================================================

    def register(self, node_type: str, executor: Any, *, override: bool = False) -> None:
        """
        Register an executor for a node type.

        Args:
            node_type: Workflow node type (e.g. "LLM", "TOOL")
            executor: Executor instance (must expose execute())
            override: If True, replaces existing executor

        Raises:
            InvalidNodeTypeError
            InvalidExecutorError
            DuplicateNodeExecutorError
        """
        normalized_type = self._normalize_node_type(node_type)
        self._validate_executor(executor)

        if normalized_type in self._registry and not override:
            raise DuplicateNodeExecutorError(
                f"Executor already registered for node type: {normalized_type}"
            )

        self._registry[normalized_type] = executor

        logger.info(
            "[NodeRegistry] Registered executor | node_type=%s | executor=%s",
            normalized_type,
            executor.__class__.__name__,
        )

    def get(self, node_type: str) -> Any:
        """
        Retrieve executor for a node type.

        Args:
            node_type: Workflow node type

        Returns:
            Registered executor instance

        Raises:
            NodeExecutorNotFoundError
        """
        normalized_type = self._normalize_node_type(node_type)
        executor = self._registry.get(normalized_type)

        if executor is None:
            available = ", ".join(self.list_registered_types()) or "none"
            logger.error(
                "[NodeRegistry] Executor not found | requested=%s | available=%s",
                normalized_type,
                available,
            )
            raise NodeExecutorNotFoundError(
                f"No executor registered for node type: {normalized_type}"
            )

        return executor

    def has(self, node_type: str) -> bool:
        """
        Check whether a node type is registered.
        """
        normalized_type = self._normalize_node_type(node_type)
        return normalized_type in self._registry

    def unregister(self, node_type: str) -> None:
        """
        Remove executor registration for a node type.

        Raises:
            NodeExecutorNotFoundError
        """
        normalized_type = self._normalize_node_type(node_type)

        if normalized_type not in self._registry:
            raise NodeExecutorNotFoundError(
                f"No executor registered for node type: {normalized_type}"
            )

        removed = self._registry.pop(normalized_type)

        logger.info(
            "[NodeRegistry] Unregistered executor | node_type=%s | executor=%s",
            normalized_type,
            removed.__class__.__name__,
        )

    def clear(self) -> None:
        """
        Clear all registered executors.
        """
        count = len(self._registry)
        self._registry.clear()

        logger.warning(
            "[NodeRegistry] Cleared all registered executors | count=%s",
            count,
        )

    def list_registered_types(self) -> List[str]:
        """
        Return all registered node types in sorted order.
        """
        return sorted(self._registry.keys())

    def dump_registry(self) -> Dict[str, str]:
        """
        Return registry snapshot for debugging / observability.
        """
        return {
            node_type: executor.__class__.__name__
            for node_type, executor in self._registry.items()
        }

    # =========================================================
    # INTERNAL HELPERS
    # =========================================================

    def _normalize_node_type(self, node_type: str) -> str:
        """
        Normalize node type into a stable uppercase key.
        """
        if node_type is None:
            raise InvalidNodeTypeError("node_type cannot be None")

        normalized = str(node_type).strip().upper()

        if not normalized:
            raise InvalidNodeTypeError("node_type cannot be empty")

        return normalized

    def _validate_executor(self, executor: Any) -> None:
        """
        Ensure executor has the required runtime contract.
        """
        if executor is None:
            raise InvalidExecutorError("executor cannot be None")

        if not hasattr(executor, "execute") or not callable(getattr(executor, "execute")):
            raise InvalidExecutorError(
                f"Executor '{executor.__class__.__name__}' must implement callable execute()"
            )
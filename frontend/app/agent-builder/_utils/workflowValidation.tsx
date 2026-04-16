type WorkflowNodeData = {
    label?: unknown;
    config?: Record<string, unknown>;
    [key: string]: unknown;
};

type WorkflowNode = {
    id?: string;
    type?: string;
    data?: WorkflowNodeData;
};

type WorkflowEdge = {
    id?: string;
    source?: string;
    target?: string;
};

export type WorkflowValidationResult = {
    isValid: boolean;
    errors: string[];
    incompleteNodes: string[];
};

const START_TYPES = new Set(["STARTNODE", "INPUT"]);
const END_TYPES = new Set(["ENDNODE", "OUTPUT"]);
const REQUIRED_CONFIG_NODE_TYPES = new Set([
    "AGENTNODE",
    "IFELSENODE",
    "LOOPNODE",
    "APINODE",
]);

const normalizeType = (type: unknown) => String(type ?? "").trim().toUpperCase();

const getNodeLabel = (node: WorkflowNode): string => {
    const label = node?.data?.label;
    if (typeof label === "string" && label.trim()) return label.trim();

    const configName = node?.data?.config?.name;
    if (typeof configName === "string" && configName.trim()) return configName.trim();

    return String(node?.type || "Node");
};

const hasMeaningfulConfig = (config: unknown): boolean => {
    if (!config || typeof config !== "object") return false;

    return Object.values(config as Record<string, unknown>).some((value) => {
        if (value == null) return false;
        if (typeof value === "string") return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object") return Object.keys(value).length > 0;
        return true;
    });
};

export const validateWorkflowForSave = (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
): WorkflowValidationResult => {
        const incompleteNodes = new Set<string>();
    const errors: string[] = [];
    const errorSet = new Set<string>();
    const addError = (message: string) => {
        if (!errorSet.has(message)) {
            errorSet.add(message);
            errors.push(message);
        }
    };

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return {
            isValid: false,
            errors: ["Workflow payload is malformed. Please refresh and try again."],
            incompleteNodes: [],
        };
    }

    if (nodes.length === 0) {
        addError("Workflow must contain at least one node.");
    }

    const nodeById = new Map<string, WorkflowNode>();
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    const reverseAdjacency = new Map<string, string[]>();

    const startNodeIds: string[] = [];
    const endNodeIds: string[] = [];

    for (const node of nodes) {
        const id = String(node?.id ?? "").trim();
        if (!id) {
            addError("Every node must have a valid ID.");
            continue;
        }

        if (nodeById.has(id)) {
            addError(`Duplicate node ID detected: ${id}.`);
            continue;
        }

        nodeById.set(id, node);
        incoming.set(id, 0);
        outgoing.set(id, 0);
        adjacency.set(id, []);
        reverseAdjacency.set(id, []);

        const nodeType = normalizeType(node?.type);
        if (START_TYPES.has(nodeType)) startNodeIds.push(id);
        if (END_TYPES.has(nodeType)) endNodeIds.push(id);
    }

    if (startNodeIds.length === 0) {
        addError("Workflow must include at least one Start node.");
    }

    if (endNodeIds.length === 0) {
        addError("Workflow must include at least one End node.");
    }

    for (const edge of edges) {
        const source = String(edge?.source ?? "").trim();
        const target = String(edge?.target ?? "").trim();

        if (!source || !target) {
            addError("Every connection must define both source and target nodes.");
            continue;
        }

        if (!nodeById.has(source)) {
            addError(`Invalid edge: source node '${source}' does not exist.`);
        }

        if (!nodeById.has(target)) {
            addError(`Invalid edge: target node '${target}' does not exist.`);
        }

        if (!nodeById.has(source) || !nodeById.has(target)) {
            continue;
        }

        if (source === target) {
            addError(`Node '${getNodeLabel(nodeById.get(source)!)}' cannot connect to itself.`);
            continue;
        }

        outgoing.set(source, (outgoing.get(source) || 0) + 1);
        incoming.set(target, (incoming.get(target) || 0) + 1);
        adjacency.get(source)!.push(target);
        reverseAdjacency.get(target)!.push(source);
    }

    for (const startId of startNodeIds) {
        if ((outgoing.get(startId) || 0) === 0) {
            addError(`Start node '${getNodeLabel(nodeById.get(startId)!)}' must have an outgoing connection.`);
        }
    }

    for (const endId of endNodeIds) {
        if ((outgoing.get(endId) || 0) > 0) {
            addError(`End node '${getNodeLabel(nodeById.get(endId)!)}' cannot have outgoing connections.`);
        }
    }

    for (const [id, node] of nodeById.entries()) {
        const nodeType = normalizeType(node?.type);
        const nodeLabel = getNodeLabel(node);

        if (!START_TYPES.has(nodeType) && (incoming.get(id) || 0) === 0) {
            addError(`Node '${nodeLabel}' has no incoming connection.`);
        }

        if (!END_TYPES.has(nodeType) && (outgoing.get(id) || 0) === 0) {
            addError(`Node '${nodeLabel}' has no outgoing connection.`);
        }

        if (REQUIRED_CONFIG_NODE_TYPES.has(nodeType)) {
            const config = node?.data?.config;
            if (!hasMeaningfulConfig(config)) {
                addError(`Node '${nodeLabel}' must be configured before saving.`);
                incompleteNodes.add(nodeLabel);
            }

            if (nodeType === "AGENTNODE") {
                const agentConfig = (config || {}) as Record<string, unknown>;
                const name = String(agentConfig.name ?? "").trim();
                const instruction = String(agentConfig.instruction ?? "").trim();
                const llm = String(agentConfig.llm ?? "").trim();

                if (!name || !instruction || !llm) {
                    addError(
                        `Agent node '${nodeLabel}' is incomplete. Name, instructions, and LLM are required.`,
                    );
                    incompleteNodes.add(nodeLabel);
                }
            }
        }
    }

    if (startNodeIds.length > 0) {
        const visitedFromStart = new Set<string>();
        const queue = [...startNodeIds];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visitedFromStart.has(current)) continue;
            visitedFromStart.add(current);

            for (const nextId of adjacency.get(current) || []) {
                if (!visitedFromStart.has(nextId)) queue.push(nextId);
            }
        }

        for (const [id, node] of nodeById.entries()) {
            if (!visitedFromStart.has(id)) {
                addError(`Node '${getNodeLabel(node)}' is not reachable from any Start node.`);
            }
        }

        if (!endNodeIds.some((endId) => visitedFromStart.has(endId))) {
            addError("At least one End node must be reachable from a Start node.");
        }

        const canReachEnd = new Set<string>();
        const reverseQueue = [...endNodeIds];

        while (reverseQueue.length > 0) {
            const current = reverseQueue.shift()!;
            if (canReachEnd.has(current)) continue;
            canReachEnd.add(current);

            for (const prevId of reverseAdjacency.get(current) || []) {
                if (!canReachEnd.has(prevId)) reverseQueue.push(prevId);
            }
        }

        for (const id of visitedFromStart) {
            const node = nodeById.get(id)!;
            const nodeType = normalizeType(node?.type);
            if (!END_TYPES.has(nodeType) && !canReachEnd.has(id)) {
                addError(`Node '${getNodeLabel(node)}' cannot reach an End node.`);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        incompleteNodes: [...incompleteNodes],
    };
};

export const formatWorkflowValidationMessage = (
    validation: WorkflowValidationResult,
    maxErrors = 3,
): string => {
    if (validation.isValid) {
        return "";
    }

    const parts: string[] = [];

    if (validation.incompleteNodes.length > 0) {
        parts.push(`Nodes incomplete: ${validation.incompleteNodes.join(", ")}.`);
    }

    if (validation.errors.length > 0) {
        parts.push(validation.errors.slice(0, maxErrors).join(" "));
    }

    return parts.join(" ").trim() || "Workflow validation failed.";
};
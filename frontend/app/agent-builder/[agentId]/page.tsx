"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { useParams,useSearchParams } from "next/navigation";
import { toast } from "sonner";

import Header from "../_components/Header";
import AgentToolsPanel from "../_components/AgentToolsPanel";
import AgentSettingsPanel from "../_components/AgentSettingsPanel";

import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  Connection,
  useOnSelectionChange,
  type ColorMode,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import StartNode from "../_customNodes/StartNode";
import AgentNode from "../_customNodes/AgentNode";
import APINode from "../_customNodes/APINode";
import IfElseNode from "../_customNodes/IfElseNode";
import LoopNode from "../_customNodes/LoopNode";
import EndNode from "../_customNodes/EndNode";
import ApprovalNode from "../_customNodes/ApprovalNode";
import OpenAiNode from "../_customNodes/_toolCustomNodes/OpenAiNode";
import MailNode from "../_customNodes/_toolCustomNodes/MailNode";
import DriveNode from "../_customNodes/_toolCustomNodes/DriveNode";
import CustomNode from "../_customNodes/_toolCustomNodes/CustomNode";

import WorkflowContext from "@/app/context/WorkflowContext";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import {
  Save,
  Rocket,
  Play,
  Send,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  formatWorkflowValidationMessage,
  validateWorkflowForSave,
} from "../_utils/workflowValidation";

/* ---------------- NODE TYPES ---------------- */
const nodeTypes = {
  StartNode,
  AgentNode,
  APINode,
  IfElseNode,
  LoopNode,
  EndNode,
  ApprovalNode,
  OpenAiNode,
  MailNode,
  DriveNode,
  CustomNode,
};

const DEFAULT_START_NODE = {
  id: "start-1",
  type: "StartNode",
  position: { x: 250, y: 100 },
  data: {
    label: "Start",
    lightBg: "#DCFCE7",
    darkBg: "#06281C",
  },
};

type AgentStatus = "draft" | "active" | "deploying" | "error";

type BuilderChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

/* ---------------- UTILS ---------------- */
const getTenantId = () =>
  localStorage.getItem("tenant_id") || localStorage.getItem("tenantId");

const normalizeChatContent = (content: string) => {
  if (!content) return "";
  let text = String(content)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\\\"/g, '"')
    .replace(/\r\n/g, "\n");
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }
  return text.trim();
};

/* ---------------- MARKDOWN MSG ---------------- */
function MarkdownMessage({ content }: { content: string }) {
  const normalized = normalizeChatContent(content);
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:leading-6 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0b1220] prose-pre:p-3 prose-code:text-cyan-300 prose-strong:text-white">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */
const AgentBuilder = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("WorkflowContext missing");

  const { nodes, setNodes, edges, setEdges, setSelectedNode } = context;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [deploymentStatus, setDeploymentStatus] = useState<AgentStatus>("draft");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isRunningChat, setIsRunningChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<BuilderChatMessage[]>([]);
  const [lastSavedSignature, setLastSavedSignature] = useState<string | null>(null);

  const params = useParams();
  const agentId = params?.agentId as string;

  const buildWorkflowPayload = useCallback(() => {
    const updatedNodes = nodes.map((node) => {
      try {
        const localConfig = localStorage.getItem(`node-config-${node.id}`);
        if (localConfig) {
          return {
            ...node,
            data: {
              ...node.data,
              config: JSON.parse(localConfig),
            },
          };
        }
        return node;
      } catch (err) {
        console.error("Error parsing config for node:", node.id, err);
        return node;
      }
    });

    return {
      nodes: updatedNodes,
      edges,
    };
  }, [nodes, edges]);

  const getWorkflowSignature = useCallback((payload: { nodes: any[]; edges: any[] }) => {
    return JSON.stringify(payload);
  }, []);

  /* -------- FETCH AGENT NAME -------- */
  useEffect(() => {
    if (!agentId) {
      toast.error("Agent ID missing");
      return;
    }

    const fetchAgent = async () => {
      try {
        const data = await api.get(`/multi_agents/${agentId}`, {
          requireAuth: true,
          requireTenant: true,
        });
        setAgentName(data.name);

        if (
          data?.published_url ||
          String(data?.status || "").toLowerCase() === "deployed"
        ) {
          setDeploymentStatus("active");
        }
      } catch (err) {
        console.error("Failed to fetch agent:", err);
        setAgentName("Agent Builder");
      }
    };

    fetchAgent();
  }, [agentId]);

  /* -------- LOAD WORKFLOW -------- */
  useEffect(() => {
    if (!agentId) return;

    const loadWorkflow = async () => {
      try {
        const data = await api.get(`/workflow/${agentId}`, {
          requireAuth: true,
          requireTenant: true,
        });

        const loadedNodes = data?.workflow_json?.nodes ?? [];
        const loadedEdges = data?.workflow_json?.edges ?? [];

        if (loadedNodes.length === 0) {
          setNodes([DEFAULT_START_NODE]);
          setEdges([]);
          setLastSavedSignature(null);
        } else {
          const nodesWithConfig = loadedNodes.map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              config: node.data?.config || {},
            },
          }));
          setNodes(nodesWithConfig);
          setEdges(loadedEdges);
          setLastSavedSignature(
            getWorkflowSignature({ nodes: nodesWithConfig, edges: loadedEdges }),
          );
        }
      } catch (err) {
        console.error("Load workflow failed:", err);
        setNodes([DEFAULT_START_NODE]);
        setEdges([]);
        setLastSavedSignature(null);
      }
    };

    loadWorkflow();
  }, [agentId, setNodes, setEdges, getWorkflowSignature]);

  /* -------- REACT FLOW HANDLERS -------- */
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  useOnSelectionChange({
    onChange: ({ nodes }: any) => {
      const node = nodes[0] ?? null;
      setSelectedNode(node);
      setSelectedNodeId(node?.id ?? null);
    },
  });

  /* -------- DELETE NODE -------- */
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") deleteSelectedNode();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedNode]);

  /* -------- SAVE WORKFLOW -------- */
  const saveWorkflow = async (): Promise<boolean> => {
    if (!agentId) {
      toast.error("Agent ID missing");
      return false;
    }

    try {
      const workflowPayload = buildWorkflowPayload();

      const validation = validateWorkflowForSave(
        workflowPayload.nodes,
        workflowPayload.edges,
      );

      if (!validation.isValid) {
        toast.error(formatWorkflowValidationMessage(validation));
        return false;
      }

      await api.post(`/workflow/${agentId}`, {
        workflow_json: workflowPayload,
      });

      // Keep in-memory graph aligned with what was persisted.
      setNodes(workflowPayload.nodes);
      setEdges(workflowPayload.edges);

      // Save ke baad localStorage clear karo
      nodes.forEach((node) => {
        localStorage.removeItem(`node-config-${node.id}`);
      });

      setLastSavedSignature(getWorkflowSignature(workflowPayload));

      toast.success("Workflow saved successfully");
      return true;
    } catch (error) {
      console.error("Workflow save error:", error);
      toast.error("Failed to save workflow");
      return false;
    }
  };

  /* -------- PUBLISH AGENT -------- */
  const publishAgent = async () => {
    if (!agentId) {
      toast.error("Agent ID missing");
      return;
    }

    try {
      setIsPublishing(true);
      setDeploymentStatus("deploying");

      const workflowPayload = buildWorkflowPayload();
      const validation = validateWorkflowForSave(
        workflowPayload.nodes,
        workflowPayload.edges,
      );

      if (!validation.isValid) {
        toast.error("Save workflow first, then publish agent.");
        setDeploymentStatus("draft");
        return;
      }

      const currentSignature = getWorkflowSignature(workflowPayload);
      if (!lastSavedSignature || currentSignature !== lastSavedSignature) {
        toast.error("Save workflow first, then publish agent.");
        setDeploymentStatus("draft");
        return;
      }

      const tenantId = getTenantId();
      if (!tenantId) {
        toast.error("Tenant ID missing");
        setDeploymentStatus("error");
        return;
      }

      const response = await api.post(
        `/deployments/deploy-agent`,
        {
          agent_id: agentId,
          tenant_id: tenantId,
          agent_type: "multi",
        },
        { requireAuth: true, requireTenant: true },
      );

      setDeploymentStatus("active");
      toast.success(response?.message || "Multi-agent published successfully");
    } catch (error: any) {
      console.error("Publish failed:", error);
      setDeploymentStatus("error");
      toast.error(
        error?.data?.detail ||
        error?.message ||
        "Failed to publish multi-agent",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  /* -------- RUN CHAT -------- */
  const runChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || !agentId) return;

    const tenantId = getTenantId();
    if (!tenantId) {
      toast.error("Tenant ID missing");
      return;
    }

    const userMessage: BuilderChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsRunningChat(true);

    try {
      const response = await api.post(
        "/executions/run",
        {
          target_id: agentId,
          tenant_id: tenantId,
          agent_type: "multi",
          text,
        },
        { requireAuth: true, requireTenant: true },
      );

      const assistantMessage: BuilderChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text:
          response?.response ||
          response?.raw_output?.text ||
          "Execution completed.",
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Execution failed:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error?.data?.detail ||
            error?.message ||
            "Execution failed. Try publishing again.",
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.error("Execution failed");
    } finally {
      setIsRunningChat(false);
    }
  };

  /* -------- RENDER -------- */
  return (
    <div
      className="flex flex-col h-screen w-full"
      style={{ background: "#080B0F", fontFamily: "'Syne', sans-serif" }}
    >
      <Header
        agentName={agentName}
        agentId={agentId}
        status={deploymentStatus}
        isPublishLoading={isPublishing}
        onPublish={publishAgent}
        showRun={deploymentStatus === "active"}
        onRun={() => setIsChatPanelOpen(true)}
        backHref="/dashboard"
        // isUndeployed={agentStatus === "DRAFT"}
      />

      <div className="flex-grow w-full relative">
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.05), transparent 70%)",
          }}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          style={{ background: "transparent" }}
        >
          <MiniMap
            style={{
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
            maskColor="rgba(0,0,0,0.6)"
          />

          <Controls
            style={{
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            color="rgba(255,255,255,0.06)"
          />

          <Panel position="top-left">
            <AgentToolsPanel />
          </Panel>

          <Panel position="top-right">
            <AgentSettingsPanel />
          </Panel>

          {/* Bottom panel */}
          <Panel position="bottom-center">
            <div
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {/* Live dot */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    deploymentStatus === "active"
                      ? "#22C55E"
                      : "#3B82F6",
                  animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                  flexShrink: 0,
                }}
              />

              {/* Node count */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#7D8590",
                }}
              >
                Nodes
              </span>
              <code
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  background: "#161B22",
                  color: "#3B82F6",
                  padding: "1px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {nodes.length}
              </code>

              <div
                style={{
                  width: 1,
                  height: 18,
                  background: "rgba(255,255,255,0.08)",
                  margin: "0 2px",
                }}
              />

              {/* Save button */}
              <Button
                onClick={saveWorkflow}
                disabled={!agentId}
                style={{
                  height: 32,
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontSize: 12,
                  fontWeight: 700,
                  background: "#3B82F6",
                  color: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 0 20px rgba(59,130,246,0.15)",
                  fontFamily: "'Syne', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !agentId ? 0.5 : 1,
                  cursor: !agentId ? "not-allowed" : "pointer",
                }}
              >
                <Save size={13} />
                Save Workflow
              </Button>
            </div>
          </Panel>
        </ReactFlow>

        {/* CHAT PANEL */}
        {isChatPanelOpen && (
  <div
    style={{
      position: "absolute",
      bottom: 20,
      right: 5,
      zIndex: 50,
      width: 550,
      height: "calc(100vh - 120px)",
      maxHeight: 720,
      minHeight: 420,
      maxWidth: "calc(100vw - 32px)",
      background: "#0a0e14",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 18,
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.06)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Syne', sans-serif",
    }}
  >
    {/* ── Accent line ── */}
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: 3, height: "100%",
        background: "rgba(59,130,246,0.45)",
        borderRadius: "18px 0 0 18px",
        zIndex: 1,
      }}
    />

    {/* ── Background grid ── */}
    <div
      style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    />

    {/* ── Header ── */}
    <div
      style={{
        position: "relative", zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px 10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.01)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MessageSquare size={15} color="#93C5FD" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f6fc", margin: 0, lineHeight: 1.2 }}>
            Run Multi-Agent
          </p>
          <p style={{
            fontSize: 10, color: "#7D8590", margin: 0,
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
          }}>
            Published workflow runtime
          </p>
        </div>
      </div>

      {/* Status dot + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#22c55e",
            animation: "pulseDot 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 10, color: "#7D8590", fontFamily: "'DM Mono', monospace" }}>
            live
          </span>
        </div>
        <button
          onClick={() => setIsChatPanelOpen(false)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            cursor: "pointer",
            color: "#7D8590",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#f0f6fc";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLButtonElement).style.color = "#7D8590";
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>

    {/* ── Messages ── */}
    <div
      style={{
        position: "relative", zIndex: 2,
        flex: 1,
        overflowY: "auto",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}
    >
      {chatMessages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "0 28px",
          }}
        >
          <div>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={18} color="#60a5fa" />
            </div>
            <p style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 700, margin: "0 0 5px" }}>
              Ask your multi-agent
            </p>
            <p style={{ fontSize: 11, color: "#7D8590", margin: 0, lineHeight: 1.6 }}>
              Test your orchestration runtime directly from the builder.
            </p>
          </div>
        </div>
      ) : (
        chatMessages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Role label */}
            <span style={{
              fontSize: 9,
              fontFamily: "'DM Mono', monospace",
              color: "#7D8590",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
              paddingLeft: message.role === "user" ? 0 : 4,
              paddingRight: message.role === "user" ? 4 : 0,
            }}>
              {message.role === "user" ? "You" : "Agent"}
            </span>

            {/* Bubble */}
            <div
              style={{
                padding: "9px 13px",
                borderRadius: message.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize: 13,
                lineHeight: 1.65,
                maxWidth: "88%",
                wordBreak: "break-word",
                ...(message.role === "user"
                  ? {
                    background: "rgba(59,130,246,0.16)",
                    border: "1px solid rgba(59,130,246,0.22)",
                    color: "#BFDBFE",
                  }
                  : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E2E8F0",
                  }),
              }}
            >
              {message.role === "assistant" ? (
                <MarkdownMessage content={message.text} />
              ) : (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.text}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>

    {/* ── Input area ── */}
    <div
      style={{
        position: "relative", zIndex: 2,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 12px",
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}
    >
      <textarea
        value={chatInput}
        onChange={(e) => {
          setChatInput(e.target.value);
          // auto-grow
          e.target.style.height = "40px";
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            runChatMessage();
          }
        }}
        placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          height: 40,
          minHeight: 40,
          maxHeight: 120,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 12,
          color: "#f0f6fc",
          outline: "none",
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1.5,
          transition: "border-color 0.2s",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      <button
        onClick={runChatMessage}
        disabled={isRunningChat || !chatInput.trim()}
        style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: chatInput.trim() ? "rgba(59,130,246,0.9)" : "rgba(59,130,246,0.12)",
          border: "1px solid rgba(59,130,246,0.3)",
          cursor: isRunningChat || !chatInput.trim() ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: isRunningChat || !chatInput.trim() ? 0.45 : 1,
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {isRunningChat ? (
          <Loader2 size={15} color="#fff" className="animate-spin" />
        ) : (
          <Send size={15} color={chatInput.trim() ? "#fff" : "#60a5fa"} />
        )}
      </button>
    </div>

    {/* ── Keyframes ── */}
    <style>{`
      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.3); }
      }
    `}</style>
  </div>
)}
      </div>
    </div>
  );
};

export default AgentBuilder;
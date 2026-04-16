"use client";

import React, { useCallback, useContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import AgentSettingsPanel from "./_components/AgentSettingsPanel";
import StartNode from "./_customNodes/StartNode";
import AgentNode from "./_customNodes/AgentNode";
import APINode from "./_customNodes/APINode";
import IfElseNode from "./_customNodes/IfElseNode";
import LoopNode from "./_customNodes/LoopNode";
import EndNode from "./_customNodes/EndNode";
import ApprovalNode from "./_customNodes/ApprovalNode";

import WorkflowContext from "@/app/context/WorkflowContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tenant } from "@/lib/tenant";
import { api } from "@/lib/api-client";
import {
  Save,
  Plus,
  Sparkles,
  Workflow,
  Tag,
  X,
  Bot,
  Layers3,
  ShieldCheck,
} from "lucide-react";
// import ToolPanel from "./_components/ToolPanel";
import {
  formatWorkflowValidationMessage,
  validateWorkflowForSave,
} from "./_utils/workflowValidation";

const nodeTypes = {
  StartNode,
  AgentNode,
  APINode,
  IfElseNode,
  LoopNode,
  EndNode,
  ApprovalNode,
};

const AgentBuilderCreatePage = () => {
  const router = useRouter();
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("WorkflowContext missing");

  const { nodes, setNodes, edges, setEdges, setSelectedNode } = context;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const [formData, setFormData] = useState({
    tenant_id: "",
    name: "",
    description: "",
    status: "pending",
    tags: [] as string[],
  });


  useEffect(() => {
    const tenantId = tenant.getCurrentTenantId();
    if (tenantId) {
      setFormData((prev) => ({ ...prev, tenant_id: tenantId }));
    }
  }, []);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: {
              stroke: "#3b82f6",
              strokeWidth: 2,
            },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  useOnSelectionChange({
    onChange: ({ nodes }: any) => {
      const node = nodes[0] ?? null;
      setSelectedNode(node);
      setSelectedNodeId(node?.id ?? null);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    const cleanTag = tagInput.trim();
    if (!cleanTag) return;
    if (formData.tags.includes(cleanTag)) return;

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, cleanTag],
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.tenant_id || !formData.name.trim()) {
      toast.error("Tenant ID and Name are required");
      return;
    }

    try {
      setIsSaving(true);

      const data = await api.post(
        "/multi_agents",
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status.toLowerCase(),
          tags: formData.tags,
        },
        { requireAuth: true, requireTenant: true },
      );

      const createdAgent = data.agent ?? data;
      setAgentId(createdAgent.id);
      setAgentName(createdAgent.name);

      const workflowSaved = await persistWorkflow(createdAgent.id, {
        silent: true,
      });

      toast.success(
        workflowSaved
          ? "Agent created and workflow saved successfully!"
          : "Agent created successfully. Save the workflow after the redirect."
      );
      setIsCreateModalOpen(false);

      router.push(`/agent-builder/${createdAgent.id}`);
    } catch (error: any) {
      console.error("Multi-agent creation error:", error);
      toast.error(error.message || "Failed to create agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNode = (tool: any) => {
    const newNode = {
      id: `${tool.id}-${Date.now()}`,
      type: "AgentNode",
      position: {
        x: 200 + Math.random() * 250,
        y: 180 + Math.random() * 250,
      },
      data: {
        label: tool.name,
        toolType: tool.type,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast.success(`${tool.name} added to workflow`);
  };

  const getWorkflowPayload = useCallback(() => {
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

        return {
          ...node,
          data: {
            ...node.data,
            config: node.data?.config || {},
          },
        };
      } catch (error) {
        console.error("Error parsing config for node:", node.id, error);
        return node;
      }
    });

    return {
      nodes: updatedNodes,
      edges,
    };
  }, [nodes, edges]);

  const persistWorkflow = async (
    targetAgentId: string,
    options?: { silent?: boolean }
  ) => {
    if (!targetAgentId) {
      toast.error("Create an agent first");
      return false;
    }

    try {
      setIsSaving(true);

      const validation = validateWorkflowForSave(nodes, edges);
      if (!validation.isValid) {
        if (!options?.silent) {
          toast.error(validation.errors[0] || "Workflow validation failed");
        }
        return false;
      }

      const workflowPayload = getWorkflowPayload();

      await api.post(
        `/workflow/${targetAgentId}`,
        {
          workflow_json: workflowPayload,
        },
        {
          requireAuth: true,
          requireTenant: true,
        }
      );

      nodes.forEach((node) => {
        localStorage.removeItem(`node-config-${node.id}`);
      });

      if (!options?.silent) {
        toast.success("Workflow saved successfully");
      }
      return true;
    } catch (error: any) {
      console.error(error);
      if (!options?.silent) {
        toast.error("Failed to save workflow");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!agentId) {
      toast.error("Create an agent first");
      return;
    }

    await persistWorkflow(agentId);
  };

  // Autosave simulation
  useEffect(() => {
    if (!agentId) return;
    if (nodes.length === 0 && edges.length === 0) return;

    setIsAutosaving(true);

    const timeout = setTimeout(() => {
      console.log("Autosaving workflow...", { nodes, edges });
      setIsAutosaving(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [nodes, edges, agentId]);

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  const headerStatus = useMemo(() => {
    if (!agentId) return "Draft";
    if (totalNodes === 0) return "Empty";
    return "Active";
  }, [agentId, totalNodes]);

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-[#06080C] text-[#F8FAFC] font-sans">
      <style jsx global>{`
        .xyflow-background {
          background-color: #06080c !important;
        }

        .react-flow__controls {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35) !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(18px) !important;
        }

        .react-flow__controls button {
          background: rgba(13, 17, 23, 0.85) !important;
          fill: #cbd5e1 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          width: 38px !important;
          height: 38px !important;
          transition: all 0.2s ease !important;
        }

        .react-flow__controls button:hover {
          background: rgba(30, 41, 59, 0.95) !important;
        }

        .react-flow__minimap {
          background: rgba(13, 17, 23, 0.85) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          backdrop-filter: blur(18px) !important;
          overflow: hidden !important;
        }

        .react-flow__attribution {
          display: none !important;
        }
      `}</style>

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[-80px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-40px] h-[360px] w-[360px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-6 h-16 border-b border-white/6 bg-[rgba(7,10,15,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shadow-lg">
            <Workflow className="h-5 w-5 text-blue-400" />
          </div>

          <div className="flex flex-col">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">
              {agentName || "Untitled Agent"}
            </h2>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {agentId && (
                <span className="text-[11px] font-mono text-slate-400">
                  {agentId.slice(0, 8)}...
                </span>
              )}

              <span
                className={`px-2.5 py-[3px] text-[10px] rounded-full border font-medium ${headerStatus === "Active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : headerStatus === "Empty"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                  }`}
              >
                {headerStatus}
              </span>

              <span className="text-[11px] text-slate-500">
                {totalNodes} nodes • {totalEdges} connections
              </span>

              {selectedNodeId && (
                <span className="text-[11px] text-blue-400">
                  Selected: {selectedNodeId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-300">
              {isAutosaving ? "Autosaving..." : "All changes synced"}
            </span>
          </div>

          <Button
            onClick={handleSaveWorkflow}
            disabled={!agentId || isSaving}
            className="h-10 px-5 gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white border-none shadow-lg shadow-blue-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          >
            <Save size={15} />
            <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save Workflow"}</span>
          </Button>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <div className="flex-grow relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            animated: true,
            style: {
              stroke: "#3b82f6",
              strokeWidth: 2,
            },
          }}
        >
          <MiniMap zoomable pannable />
          <Controls position="bottom-right" showInteractive={false} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.3}
            color="rgba(255,255,255,0.05)"
          />

          {/* LEFT TOOL PANEL */}
          {/* <div className="absolute top-5 left-5 z-50">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
              <ToolPanel onAddNode={handleAddNode} />
            </div>
          </div> */}

          {/* RIGHT SETTINGS PANEL */}
          <Panel position="top-right" className="m-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
              <AgentSettingsPanel />
            </div>
          </Panel>

          {/* EMPTY CANVAS HINT */}
          {nodes.length === 0 && agentId && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="max-w-md text-center px-6">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 shadow-lg shadow-blue-500/10">
                  <Layers3 className="h-7 w-7 text-blue-400" />
                </div>

                <h3 className="text-xl font-semibold text-white tracking-tight">
                  Your canvas is ready
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Start building your multi-agent workflow by adding tools from the left panel.
                  Connect nodes to create execution logic.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                  <Bot className="h-4 w-4 text-blue-400" />
                  Drag, connect, configure, deploy
                </div>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>

      {/* INITIAL OVERLAY */}
      {!agentId && !isCreateModalOpen && (
        <div className="absolute inset-0 flex justify-center items-center bg-[#05070B]/75 backdrop-blur-md z-40">
          <div className="relative overflow-hidden bg-[rgba(13,17,23,0.85)] border border-white/10 rounded-3xl shadow-[0_25px_100px_rgba(0,0,0,0.55)] p-8 text-center w-[440px]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-blue-600/10 blur-[90px]" />
            </div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-lg">
                <Plus className="text-blue-400 h-6 w-6" />
              </div>

              <h3 className="text-2xl font-semibold text-white tracking-tight">
                Build a New Agent
              </h3>

              <p className="text-sm mt-3 mb-8 text-slate-400 leading-7 px-4">
                Register your agent metadata to unlock the workflow canvas and start designing
                your orchestration pipeline.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8 text-left">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <Bot className="h-5 w-5 text-blue-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">AI Agents</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <Workflow className="h-5 w-5 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Workflows</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Approvals</p>
                </div>
              </div>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-2xl font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-600/20"
              >
                Register New Agent
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE AGENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-md z-50 p-4">
          <div className="w-full max-w-[560px] bg-gradient-to-b from-[#0D1117] to-[#090C12] border border-white/10 rounded-3xl shadow-[0_20px_100px_rgba(0,0,0,0.65)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/6 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    Agent Registration
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Create the base identity for your multi-agent workflow.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-7 space-y-6">
              {/* NAME */}
              <div className="space-y-2.5">
                <Label className="text-xs tracking-wide text-slate-300 font-medium">
                  Agent Name
                </Label>
                <Input
                  name="name"
                  placeholder="e.g. Customer Support Orchestrator"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-12 bg-[#0A0E14] border-white/10 text-white rounded-2xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-500"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2.5">
                <Label className="text-xs tracking-wide text-slate-300 font-medium">
                  Description
                </Label>
                <Input
                  name="description"
                  placeholder="Short summary about what this workflow does"
                  value={formData.description}
                  onChange={handleChange}
                  className="h-12 bg-[#0A0E14] border-white/10 text-white rounded-2xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-500"
                />
              </div>

              {/* STATUS */}
              <div className="space-y-2.5">
                <Label className="text-xs tracking-wide text-slate-300 font-medium">
                  Initial Status
                </Label>
                <Select
                  defaultValue="pending"
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="h-12 bg-[#0A0E14] border-white/10 text-white rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D1117] border-white/10 text-white rounded-2xl">
                    <SelectItem
                      value="active"
                      className="focus:bg-blue-600/10 focus:text-blue-400 rounded-xl"
                    >
                      Active
                    </SelectItem>
                    <SelectItem
                      value="off"
                      className="focus:bg-blue-600/10 focus:text-blue-400 rounded-xl"
                    >
                      Off
                    </SelectItem>
                    <SelectItem
                      value="pending"
                      className="focus:bg-blue-600/10 focus:text-blue-400 rounded-xl"
                    >
                      Pending
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TAGS */}
              <div className="space-y-3">
                <Label className="text-xs tracking-wide text-slate-300 font-medium">
                  Tags & Classification
                </Label>

                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    placeholder="Type tag and press Enter"
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    className="h-12 bg-[#0A0E14] border-white/10 text-white rounded-2xl placeholder:text-slate-500"
                  />
                  <Button
                    onClick={addTag}
                    className="h-12 px-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap min-h-[44px]">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => removeTag(tag)}
                      className="group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-full cursor-pointer bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-300 border border-blue-500/20 hover:scale-105 hover:from-blue-500/15 hover:to-indigo-500/15 transition-all"
                    >
                      {tag}
                      <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/6 flex gap-3">
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 h-12 bg-transparent hover:bg-white/5 text-slate-300 rounded-2xl font-medium text-sm border border-white/10 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-2xl font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-600/20 disabled:opacity-60"
              >
                {isSaving ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentBuilderCreatePage;
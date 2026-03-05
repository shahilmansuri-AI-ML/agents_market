"use client";

import React, { useCallback, useContext, useState } from "react";
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

import AgentToolsPanel from "./_components/AgentToolsPanel";
import AgentSettingsPanel from "./_components/AgentSettingsPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  const [formData, setFormData] = useState({
    tenant_id: "",
    name: "",
    status: "pending",
    tags: [] as string[],
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (formData.tags.includes(tagInput)) return;

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput],
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
    if (!formData.tenant_id || !formData.name) {
      toast.error("Tenant ID and Name are required");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/multi_agents/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: formData.tenant_id,
            name: formData.name,
            status: formData.status.toLowerCase(),
            tags: formData.tags,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || "Failed to create agent");
        return;
      }

      const createdAgent = data.agent ?? data;
      setAgentId(createdAgent.id);
      setAgentName(createdAgent.name);

      toast.success("Agent created successfully!");
      setIsCreateModalOpen(false);
      router.push(`/agent-builder/${createdAgent.id}`);
    } catch (error: any) {
      toast.error(error.message || "Backend error");
    }
  };

  const handleSaveWorkflow = async () => {
    if (!agentId) return;
    toast.info("Saving workflow for Agent: " + agentId);
  };

  return (
    <div
      className="
    flex flex-col h-screen w-full relative
    bg-gray-50 text-gray-900
    dark:bg-[#0b0f14] dark:text-white
  "
    >
      {/* HEADER */}
      <div
        className="
      flex items-center justify-between px-6 py-4 border-b
      bg-white border-gray-200
      dark:bg-[#0f1115] dark:border-[#1f2937]
    "
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {agentName || "Untitled Agent"}
          </h2>

          {agentId && (
            <p className="text-xs mt-1 text-gray-500 dark:text-[#9CA3AF]">
              ID: {agentId}
            </p>
          )}
        </div>

        <Button
          onClick={handleSaveWorkflow}
          disabled={!agentId}
          className="
        px-5
        bg-gray-900 hover:bg-black text-white border border-gray-300
        dark:bg-[#111827] dark:hover:bg-[#1f2937] dark:border-[#1f2937]
      "
        >
          Save Workflow
        </Button>
      </div>

      {/* CANVAS */}
      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-100 dark:bg-[#0b0f14]"
        >
          <MiniMap
            className="
          bg-white border border-gray-300
          dark:bg-[#0f1115] dark:border-[#1f2937]
        "
          />

          <Controls
            className="
          bg-white border border-gray-300
          dark:bg-[#0f1115] dark:border-[#1f2937]
        "
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="currentColor"
            className="text-gray-300 dark:text-[#1f2937]"
          />

          <Panel position="top-left">
            <div
              className="
            bg-white border border-gray-300 rounded-lg p-2
            dark:bg-[#0f1115] dark:border-[#1f2937]
          "
            >
              <AgentToolsPanel />
            </div>
          </Panel>

          <Panel position="top-right">
            <div
              className="
            bg-white border border-gray-300 rounded-lg p-2
            dark:bg-[#0f1115] dark:border-[#1f2937]
          "
            >
              <AgentSettingsPanel />
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* INITIAL OVERLAY */}
      {!agentId && !isCreateModalOpen && (
        <div
          className="
        absolute inset-0 flex justify-center items-start pt-24
        bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40
      "
        >
          <div
            className="
          bg-white border border-gray-300
          dark:bg-[#0f1115] dark:border-[#1f2937]
          rounded-xl shadow-xl p-7 text-center w-[340px]
        "
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Initialize Canvas
            </h3>

            <p className="text-sm mt-2 mb-5 text-gray-500 dark:text-[#9CA3AF]">
              Register an agent before using builder
            </p>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Register Agent
            </Button>
          </div>
        </div>
      )}

      {/* CREATE AGENT MODAL */}
      {isCreateModalOpen && (
        <div
          className="
        fixed inset-0 flex justify-center items-start pt-24
        bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50
      "
        >
          <div
            className="
          w-[440px]
          bg-white border border-gray-300
          dark:bg-[#0f1115] dark:border-[#1f2937]
          rounded-xl shadow-2xl p-6
        "
          >
            <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
              Register Agent
            </h2>

            {/* NAME */}
            <div className="mb-4">
              <Label className="text-gray-600 dark:text-[#9CA3AF]">
                Agent Name
              </Label>

              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="
              mt-1
              bg-white border-gray-300 text-gray-900
              dark:bg-[#0b0f14] dark:border-[#1f2937] dark:text-white
            "
              />
            </div>

            {/* TENANT */}
            <div className="mb-4">
              <Label className="text-gray-600 dark:text-[#9CA3AF]">
                Tenant ID
              </Label>

              <Input
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleChange}
                className="
              mt-1
              bg-white border-gray-300 text-gray-900
              dark:bg-[#0b0f14] dark:border-[#1f2937] dark:text-white
            "
              />
            </div>

            {/* STATUS */}
            <div className="mb-4">
              <Label className="text-gray-600 dark:text-[#9CA3AF]">
                Status
              </Label>

              <Select
                defaultValue="pending"
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value,
                  }))
                }
              >
                <SelectTrigger
                  className="
                mt-1
                bg-white border-gray-300 text-gray-900
                dark:bg-[#0b0f14] dark:border-[#1f2937] dark:text-white
              "
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent
                  className="
                bg-white border border-gray-300 text-gray-900
                dark:bg-[#0f1115] dark:border-[#1f2937] dark:text-white
              "
                >
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TAG */}
            <div className="mb-5">
              <Label className="text-gray-600 dark:text-[#9CA3AF]">Tags</Label>

              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="
                bg-white border-gray-300 text-gray-900
                dark:bg-[#0b0f14] dark:border-[#1f2937] dark:text-white
              "
                />

                <Button
                  onClick={addTag}
                  className="
                bg-gray-900 hover:bg-black text-white border border-gray-300
                dark:bg-[#111827] dark:hover:bg-[#1f2937] dark:border-[#1f2937]
              "
                >
                  Add
                </Button>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="
                  px-3 py-1 text-xs rounded-full cursor-pointer
                  bg-gray-200 text-gray-800 border border-gray-300
                  hover:bg-gray-300
                  dark:bg-[#111827] dark:text-white dark:border-[#1f2937] dark:hover:bg-[#1f2937]
                "
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                className="
              flex-1
              bg-gray-900 hover:bg-black text-white border border-gray-300
              dark:bg-[#111827] dark:hover:bg-[#1f2937] dark:border-[#1f2937]
            "
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Create Agent
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentBuilderCreatePage;

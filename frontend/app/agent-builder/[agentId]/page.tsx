"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  type ColorMode
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import StartNode from "../_customNodes/StartNode";
import AgentNode from "../_customNodes/AgentNode";
import APINode from "../_customNodes/APINode";
import IfElseNode from "../_customNodes/IfElseNode";
import LoopNode from "../_customNodes/LoopNode";
import EndNode from "../_customNodes/EndNode";
import ApprovalNode from "../_customNodes/ApprovalNode";

import WorkflowContext from "@/app/context/WorkflowContext";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

/* ---------------- NODE TYPES ---------------- */
const nodeTypes = {
  StartNode,
  AgentNode,
  APINode,
  IfElseNode,
  LoopNode,
  EndNode,
  ApprovalNode,
};

/* ---------------- COMPONENT ---------------- */
const AgentBuilder = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [colorMode, setColorMode] = useState<ColorMode>(isDark ? "dark" : "light");

  const context = useContext(WorkflowContext);
  if (!context) throw new Error("WorkflowContext missing");

  const { nodes, setNodes, edges, setEdges, setSelectedNode } = context;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>("");

  const params = useParams();
  const agentId = params?.agentId as string;

  /* -------- FETCH AGENT NAME -------- */
  useEffect(() => {
    if (!agentId) {
      toast.error("Agent ID missing");
      return;
    }

    const fetchAgent = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/multi_agents/${agentId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAgentName(data.name);
      } catch {
        setAgentName("Agent Builder");
      }
    };

    fetchAgent();
  }, [agentId]);

  /* -------- LOAD WORKFLOW ON PAGE LOAD -------- */
  useEffect(() => {
    if (!agentId) return;

    const loadWorkflow = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow/${agentId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data?.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges || []);
        } else {
          setNodes((prev) =>
            prev.length === 0
              ? [
                  {
                    id: "start-1",
                    type: "StartNode",
                    position: { x: 250, y: 100 },
                    data: { label: "Start", lightBg: "#DCFCE7", darkBg: "#06281C" },
                  },
                ]
              : prev,
          );
        }
      } catch (err) {
        console.error("Load workflow failed", err);
      }
    };

    loadWorkflow();
  }, [agentId, setNodes, setEdges]);

  /* -------- REACT FLOW HANDLERS -------- */
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
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
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
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
  const saveWorkflow = async () => {
    if (!agentId) {
      toast.error("Agent ID missing");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflow/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!res.ok) throw new Error();
      toast.success("Workflow saved successfully");
    } catch {
      toast.error("Failed to save workflow");
    }
  };

  /* -------- RENDER -------- */
  return (
    <div className="flex flex-col h-screen w-full transition-colors duration-200">
      <Header agentName={agentName} agentId={agentId} />

      <div className="flex-grow w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          colorMode={colorMode}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

          <Panel position="top-left">
            <AgentToolsPanel />
          </Panel>

          <Panel position="top-right">
            <AgentSettingsPanel />
          </Panel>

          <Panel
            position="bottom-center"
            className={`rounded-lg px-3 py-2 border transition-colors duration-200 ${
              isDark ? "bg-[#0f0f0f] border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <Button
              onClick={saveWorkflow}
              disabled={!agentId}
              className={`transition-colors duration-200 ${
                isDark
                  ? "bg-white text-black hover:bg-gray-300"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Save
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default AgentBuilder;
"use client";

import { useContext, useEffect, useState } from "react";
import WorkflowContext from "@/app/context/WorkflowContext";

import AgentSettings from "../_nodeSettings/AgentNodeSettings";
import { EndSettings } from "../_nodeSettings/EndNodeSettings";
import IfElseNodeSettings from "../_nodeSettings/IfElseNodeSettings";
import LoopNodeSettings from "../_nodeSettings/LoopNodeSettings";
import ApiNodeSettings from "../_nodeSettings/ApiNodeSettings";

import { useTheme } from "next-themes";

export default function AgentSettingsPanel() {
  const context = useContext(WorkflowContext);
  if (!context) return null;

  const { selectedNode, setNodes } = context;

  // ✅ Dynamic theme handling
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const onUpdateNodeData = (formData: any) => {
    if (!selectedNode || !formData) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label:
                  formData.name ?? node.data?.label ?? selectedNode.type,
                settings: formData,
              },
            }
          : node
      )
    );
  };

  // Dynamic styles
  const bgColor = isDark ? "#0f1115" : "#f9fafb"; // Tailwind bg-gray-50 dark:bg-[#0f1115]
  const borderColor = isDark ? "#1f2937" : "#e5e7eb"; // border-slate-200 dark:border-[#1f2937]
  const textColor = isDark ? "#fff" : "#1f2937"; // text-slate-800 dark:text-white
  const textSubColor = isDark ? "#9ca3af" : "#6b7280"; // text-slate-400/500

  return (
    <div
      className="w-90 border-l rounded-t-2xl p-4 transition-colors duration-200"
      style={{ backgroundColor: bgColor, borderColor: borderColor }}
    >
      {/* Header */}
      <h2
        className="font-semibold mb-2"
        style={{ color: textColor }}
      >
        ⚙ Agent Settings
      </h2>

      {/* Empty State */}
      {!selectedNode && (
        <p style={{ color: textSubColor }} className="text-sm">
          Select a node to configure settings
        </p>
      )}

      {/* Node Settings */}
      {selectedNode?.type === "AgentNode" && (
        <AgentSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "EndNode" && (
        <EndSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "IfElseNode" && (
        <IfElseNodeSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "LoopNode" && (
        <LoopNodeSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
      {selectedNode?.type === "APINode" && (
        <ApiNodeSettings
          selectedNode={selectedNode}
          updateFormData={onUpdateNodeData}
        />
      )}
    </div>
  );
}
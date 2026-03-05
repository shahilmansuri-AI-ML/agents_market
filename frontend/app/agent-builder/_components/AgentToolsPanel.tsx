"use client";

import { useContext, useEffect, useState } from "react";
import WorkflowContext from "@/app/context/WorkflowContext";
import {
  MousePointer2,
  Square,
  GitBranch,
  Repeat,
  ThumbsUp,
  Radio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";

type ToolConfig = {
  name: string;
  icon: LucideIcon;
  type: string;
  lightBg: string;
  darkBg: string;
};

const AgentTools: ToolConfig[] = [
  { name: "Agent", icon: MousePointer2, type: "AgentNode", lightBg: "#DCFCE7", darkBg: "#06281C" },
  { name: "End", icon: Square, type: "EndNode", lightBg: "#FFE3E3", darkBg: "#2A0B0B" },
  { name: "If / Else", icon: GitBranch, type: "IfElseNode", lightBg: "#FEF9C4", darkBg: "#2A2605" },
  { name: "While", icon: Repeat, type: "LoopNode", lightBg: "#E0F2FE", darkBg: "#0A2235" },
  { name: "User Approval", icon: ThumbsUp, type: "ApprovalNode", lightBg: "#F3E8FF", darkBg: "#1E0B2A" },
  { name: "API", icon: Radio, type: "APINode", lightBg: "#E0F7FA", darkBg: "#062529" },
];

export default function AgentToolsPanel() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("WorkflowContext missing");

  const { setNodes } = context;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const onToolClick = (tool: ToolConfig) => {
    setNodes((prev) => [
      ...prev,
      {
        id: `${tool.type}-${Date.now()}`,
        position: { x: prev.length * 20 + 80, y: prev.length * 20 + 80 },
        data: { label: tool.name, bgColor: isDark ? tool.darkBg : tool.lightBg },
        type: tool.type,
      },
    ]);
  };

  return (
    <div
      className="
        bg-white dark:bg-[#0f1115]
        border border-slate-200 dark:border-[#1f2937]
        p-4 rounded-2xl w-56
        shadow-md dark:shadow-lg
        transition-colors duration-200
      "
    >
      <h2 className="font-bold mb-3 text-slate-700 dark:text-white">🧠 Agent Tools</h2>

      <div className="space-y-2">
        {AgentTools.map((tool) => {
          const Icon = tool.icon;
          const bgColor = isDark ? tool.darkBg : tool.lightBg;

          return (
            <div
              key={tool.name}
              onClick={() => onToolClick(tool)}
              className="
                flex items-center gap-3 p-2
                rounded-xl cursor-pointer
                hover:bg-slate-100 dark:hover:bg-[#111827]
                transition-colors
              "
            >
              <div
                className="
                  h-8 w-8 flex items-center justify-center rounded-lg
                  border border-transparent dark:border-[#1f2937]
                  transition-colors duration-200
                "
                style={{ backgroundColor: bgColor }}
              >
                <Icon className="text-slate-700 dark:text-slate-300" size={18} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {tool.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
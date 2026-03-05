"use client";

import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

export default function AgentNode({ data }: any) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background & text colors
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  const titleColor = isDark ? "#ffffff" : "#111827";
  const subtitleColor = isDark ? "#9CA3AF" : "#6B7280";
  const iconColor = isDark ? "#818CF8" : "#374151"; // indigo in dark, slate in light

  return (
    <div
      style={{ backgroundColor: nodeBg, transition: "background-color 0.2s" }}
      className="
        border border-slate-200 dark:border-[#1f2937]
        rounded-lg px-3 py-2 shadow-sm dark:shadow-md
        min-w-[140px] transition-colors duration-300
      "
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="p-2 rounded-md flex items-center justify-center border border-transparent dark:border-[#1f2937]">
          <Bot size={18} style={{ color: iconColor }} />
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <h2 style={{ color: titleColor }} className="text-sm font-semibold">
            {data.label || "Agent"}
          </h2>
          <p style={{ color: subtitleColor }} className="text-[11px]">
            AI Node
          </p>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#818CF8" : "#3B82F6",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#818CF8" : "#3B82F6",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
    </div>
  );
}
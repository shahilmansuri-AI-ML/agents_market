"use client";

import { Handle, Position } from "@xyflow/react";
import { Webhook } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const APINode = ({ data }: any) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background & text colors
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  const titleColor = isDark ? "#ffffff" : "#111827";
  const subtitleColor = isDark ? "#9CA3AF" : "#6B7280";
  const iconColor = isDark ? "#22d3ee" : "#0f172a"; // cyan in dark, slate in light

  return (
    <div
      style={{ backgroundColor: nodeBg, transition: "background-color 0.2s" }}
      className="
        border border-slate-200 dark:border-[#1f2937]
        rounded-lg px-3 py-2 shadow-sm dark:shadow-md
        min-w-[160px]
        transition-colors duration-200
      "
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="p-2 rounded-md flex items-center justify-center border border-transparent dark:border-[#1f2937]">
          <Webhook size={18} style={{ color: iconColor }} />
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <h2 style={{ color: titleColor }} className="text-sm font-semibold">
            {data?.label || "API Request"}
          </h2>
          <p style={{ color: subtitleColor }} className="text-[11px] font-medium tracking-wide">
            HTTP Client
          </p>
        </div>
      </div>

      {/* INPUT HANDLE */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#22d3ee" : "#06b6d4",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />

      {/* OUTPUT HANDLE */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#22d3ee" : "#06b6d4",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
    </div>
  );
};

export default APINode;
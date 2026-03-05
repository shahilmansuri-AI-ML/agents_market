"use client";

import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

export default function StartNode({ data }: any) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background & text colors
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  const titleColor = isDark ? "#ffffff" : "#111827";
  const iconColor = isDark ? "#10b981" : "#065f46"; // green in dark, dark green in light

  return (
    <div
      style={{ backgroundColor: nodeBg, transition: "background-color 0.2s" }}
      className="
        border-2 border-slate-300 dark:border-[#1f2937]
        rounded-lg p-2 shadow-sm dark:shadow-md
        w-25
        transition-colors duration-200
      "
    >
      <div className="flex items-center gap-2">
        {/* Icon */}
        <div className="h-7 w-7 rounded flex items-center justify-center shrink-0">
          <Play size={14} style={{ color: iconColor }} />
        </div>

        {/* Text */}
        <div className="flex flex-col truncate">
          <h2 style={{ color: titleColor }} className="text-xs font-bold truncate">
            {data?.label || "Start"}
          </h2>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 border border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#34d399" : "#10b981", // green shades
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
    </div>
  );
}
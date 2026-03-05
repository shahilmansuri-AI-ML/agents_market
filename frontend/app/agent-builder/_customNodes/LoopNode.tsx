"use client";

import { Handle, Position } from "@xyflow/react";
import { Repeat } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const LoopNode = ({ data }: any) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  // Text colors
  const titleColor = isDark ? "#ffffff" : "#111827";
  const subtitleColor = isDark ? "#a1a1aa" : "#6b7280";
  // Icon color
  const iconColor = isDark ? "#3b82f6" : "#374151"; // blue in dark, slate in light

  return (
    <div
      style={{
        backgroundColor: nodeBg,
        transition: "background-color 0.2s",
      }}
      className="
        border-2 rounded-lg p-2 shadow-sm
        min-w-[130px]
      "
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="p-2 rounded-md flex items-center justify-center">
          <Repeat size={18} style={{ color: iconColor }} />
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <h2
            style={{ color: titleColor }}
            className="text-sm font-bold"
          >
            {data?.label || "While Loop"}
          </h2>
          <p
            style={{ color: subtitleColor }}
            className="text-[11px] font-medium tracking-wide"
          >
            Iterator
          </p>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#60a5fa" : "#2563eb", // dark/light blue
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#60a5fa" : "#2563eb",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
    </div>
  );
};

export default LoopNode;
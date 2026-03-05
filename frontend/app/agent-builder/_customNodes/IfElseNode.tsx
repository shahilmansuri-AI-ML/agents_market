"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const IfElseNode = ({ data }: any) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background & text colors
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  const titleColor = isDark ? "#ffffff" : "#111827";
  const iconColor = isDark ? "#facc15" : "#ca8a04"; // yellow shades

  // TRUE / FALSE path colors
  const trueText = isDark ? "#4ade80" : "#16a34a"; // green
  const falseText = isDark ? "#f87171" : "#dc2626"; // red
  const trueBg = isDark ? "#111827" : "#f9fafb";
  const falseBg = isDark ? "#111827" : "#f9fafb";

  return (
    <div
      style={{ backgroundColor: nodeBg, transition: "background-color 0.2s" }}
      className="
        border border-slate-200 dark:border-[#1f2937]
        rounded-md p-1.5 shadow-sm dark:shadow-md
        w-36 transition-colors duration-200
      "
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-50 dark:border-[#1f2937]">
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 border-[1.5px] border-white shadow-sm"
          style={{ backgroundColor: isDark ? "#9ca3af" : "#9ca3af" }}
        />

        {/* Icon */}
        <div className="h-6 w-6 rounded flex items-center justify-center shrink-0 border border-transparent dark:border-[#1f2937]">
          <GitBranch size={12} style={{ color: iconColor }} />
        </div>

        {/* Title */}
        <h2 style={{ color: titleColor }} className="text-[10px] font-bold uppercase">
          Logic
        </h2>
      </div>

      {/* Output Rows */}
      <div className="mt-1.5 space-y-1">
        {/* TRUE Path */}
        <div
          style={{ backgroundColor: trueBg }}
          className="relative flex items-center justify-between px-1.5 py-1 rounded border border-transparent dark:border-[#1f2937]"
        >
          <span style={{ color: trueText }} className="text-[9px] font-bold">
            TRUE
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="if-source"
            className="!w-1.5 !h-1.5 border-[1px] border-white shadow-sm"
            style={{
              right: "-4px",
              backgroundColor: trueText,
              borderColor: isDark ? "#0f1115" : "#ffffff",
            }}
          />
        </div>

        {/* FALSE Path */}
        <div
          style={{ backgroundColor: falseBg }}
          className="relative flex items-center justify-between px-1.5 py-1 rounded border border-transparent dark:border-[#1f2937]"
        >
          <span style={{ color: falseText }} className="text-[9px] font-bold">
            FALSE
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="else-source"
            className="!w-1.5 !h-1.5 border-[1px] border-white shadow-sm"
            style={{
              right: "-4px",
              backgroundColor: falseText,
              borderColor: isDark ? "#0f1115" : "#ffffff",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IfElseNode;
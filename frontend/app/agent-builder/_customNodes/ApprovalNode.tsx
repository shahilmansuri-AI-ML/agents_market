"use client";

import { Handle, Position } from "@xyflow/react";
import { UserCheck, XCircle, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const ApprovalNode = ({ data }: any) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Node background & text colors
  const nodeBg = isDark ? "#0f1115" : "#ffffff";
  const titleColor = isDark ? "#ffffff" : "#111827";
  const subtitleColor = isDark ? "#9CA3AF" : "#6B7280";
  const iconColor = isDark ? "#3B82F6" : "#2563EB"; // blue dynamic

  // Button text/icon colors (disabled style)
  const btnBg = isDark ? "#111827" : "#F9FAFB";
  const btnBorder = isDark ? "#1f2937" : "#E5E7EB";
  const btnText = isDark ? "#6B7280" : "#9CA3AF";

  return (
    <div
      style={{ backgroundColor: nodeBg, transition: "background-color 0.2s" }}
      className="
        border border-slate-200 dark:border-[#1f2937]
        rounded-xl px-3 py-3 shadow-sm dark:shadow-md
        min-w-[190px] transition-colors duration-200
      "
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#1f2937]">
        {/* ICON */}
        <div className="p-2 rounded-lg flex items-center justify-center border border-transparent dark:border-[#1f2937]">
          <UserCheck size={18} style={{ color: iconColor }} />
        </div>

        {/* TEXT */}
        <div className="flex flex-col">
          <h2 style={{ color: titleColor }} className="text-sm font-semibold">
            {data?.label || "User Approval"}
          </h2>
          <p
            style={{ color: subtitleColor }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            Human Task
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-2 mt-3">
        {/* ACCEPT */}
        <div
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md opacity-50 cursor-not-allowed"
          style={{
            backgroundColor: btnBg,
            border: `1px solid ${btnBorder}`,
            color: btnText,
          }}
        >
          <CheckCircle2 size={12} style={{ color: btnText }} />
          <span className="text-[10px] font-bold">{`Accept`}</span>
        </div>

        {/* REJECT */}
        <div
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md opacity-50 cursor-not-allowed"
          style={{
            backgroundColor: btnBg,
            border: `1px solid ${btnBorder}`,
            color: btnText,
          }}
        >
          <XCircle size={12} style={{ color: btnText }} />
          <span className="text-[10px] font-bold">{`Reject`}</span>
        </div>
      </div>

      {/* HANDLES */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#3B82F6" : "#2563EB",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 border-2 border-white shadow-sm"
        style={{
          backgroundColor: isDark ? "#3B82F6" : "#2563EB",
          borderColor: isDark ? "#0f1115" : "#ffffff",
        }}
      />
    </div>
  );
};

export default ApprovalNode;
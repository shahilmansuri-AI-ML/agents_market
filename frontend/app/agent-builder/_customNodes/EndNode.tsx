"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Square, Flag, CheckCircle2 } from "lucide-react";

interface EndNodeData {
  label?: string;
  status?: "completed" | "draft";
  result?: string;
}

const EndNode = ({ data }: { data?: EndNodeData }) => {
  const accent = "#EF4444";

  return (
    <div
      className="group relative min-w-[240px] overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(10,15,28,0.98) 100%)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
      }}
    >
      {/* top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            background: "rgba(30,41,59,0.9)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <Square
            size={15}
            strokeWidth={2.6}
            style={{
              color: accent,
              fill: `${accent}22`,
            }}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-50">
              {data?.label || "End Session"}
            </span>

            <Flag className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(239,68,68,0.12)",
                color: "#F87171",
                borderColor: "rgba(239,68,68,0.28)",
              }}
            >
              End
            </span>

            <span className="truncate text-[11px] font-medium text-slate-400">
              {data?.result || "Workflow termination"}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5" />

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 text-[11px]">
        <span className="text-slate-400">Final Output</span>

        <span
          className="rounded-md px-2 py-1 font-semibold"
          style={{
            background:
              data?.status === "completed"
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
            color:
              data?.status === "completed" ? "#4ADE80" : "#F87171",
            border:
              data?.status === "completed"
                ? "1px solid rgba(34,197,94,0.18)"
                : "1px solid rgba(239,68,68,0.18)",
          }}
        >
          {data?.status === "completed" ? "Completed" : "Terminal"}
        </span>
      </div>

      {/* Handle (only input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: accent,
          borderColor: "#0F172A",
        }}
      />
    </div>
  );
};

export default EndNode;
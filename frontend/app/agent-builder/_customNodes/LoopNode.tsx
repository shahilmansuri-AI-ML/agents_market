"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Repeat, RotateCw, Play } from "lucide-react";

interface LoopNodeData {
  label?: string;
  loopCount?: string | number;
  iteratorName?: string;
  status?: "configured" | "draft";
}

const LoopNode = ({ data }: { data?: LoopNodeData }) => {
  const accent = "#8B5CF6";

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
          opacity: 0.85,
        }}
      />

      {/* subtle radial hover glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.05]"
        style={{
          background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
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
          <Repeat
            size={17}
            strokeWidth={2.4}
            style={{ color: accent }}
            className="transition-transform duration-700 group-hover:rotate-180"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-50">
              {data?.label || "Loop Block"}
            </span>

            <RotateCw className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(139,92,246,0.12)",
                color: "#A78BFA",
                borderColor: "rgba(139,92,246,0.28)",
              }}
            >
              Loop
            </span>

            <span className="truncate text-[11px] font-medium text-slate-400">
              {data?.iteratorName || "Iterator"}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5" />

      {/* Body */}
      <div className="flex items-center justify-between px-4 py-3 text-[11px]">
        <div className="flex items-center gap-2">
          <div
            className="rounded-md px-2 py-1 font-semibold"
            style={{
              background: "rgba(139,92,246,0.12)",
              color: "#C4B5FD",
              border: "1px solid rgba(139,92,246,0.18)",
            }}
          >
            {data?.loopCount || 1}x
          </div>

          <span className="text-slate-400">Repeat execution</span>
        </div>

        <Play size={10} className="rotate-90 text-violet-400/40" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 text-[11px]">
        <span className="text-slate-400">Control Flow</span>

        <span
          className="rounded-md px-2 py-1 font-semibold"
          style={{
            background:
              data?.status === "configured"
                ? "rgba(34,197,94,0.12)"
                : "rgba(139,92,246,0.12)",
            color:
              data?.status === "configured" ? "#4ADE80" : "#A78BFA",
            border:
              data?.status === "configured"
                ? "1px solid rgba(34,197,94,0.18)"
                : "1px solid rgba(139,92,246,0.18)",
          }}
        >
          {data?.status === "configured" ? "Configured" : "Draft"}
        </span>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: accent,
          borderColor: "#0F172A",
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: accent,
          borderColor: "#0F172A",
        }}
      />
    </div>
  );
};

export default LoopNode;
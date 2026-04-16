"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch, CheckCircle2, XCircle, Split } from "lucide-react";

interface IfElseNodeData {
  label?: string;
  condition?: string;
  status?: "configured" | "draft";
}

const IfElseNode = ({ data }: { data?: IfElseNodeData }) => {
  const accent = "#F59E0B";
  const trueColor = "#10B981";
  const falseColor = "#EF4444";

  return (
    <div
      className="group relative min-w-[250px] overflow-visible rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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
          <GitBranch size={16} strokeWidth={2.4} style={{ color: accent }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-50">
              {data?.label || "Logic Filter"}
            </span>

            <Split className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#FBBF24",
                borderColor: "rgba(245,158,11,0.28)",
              }}
            >
              Condition
            </span>

            <span className="truncate text-[11px] font-medium text-slate-400">
              {data?.condition || "Evaluate branch logic"}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5" />

      {/* Branches */}
      <div className="space-y-2 px-4 py-3">
        {/* TRUE */}
        <div
          className="relative flex items-center justify-between rounded-xl border px-3 py-2 transition-all hover:translate-x-[1px]"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.18)",
              }}
            >
              <CheckCircle2 size={12} style={{ color: trueColor }} />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                True
              </span>
              <span className="text-[10px] text-slate-500">Positive path</span>
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!h-3 !w-3 !border-2 !shadow-md"
            style={{
              backgroundColor: trueColor,
              borderColor: "#0F172A",
            }}
          />
        </div>

        {/* FALSE */}
        <div
          className="relative flex items-center justify-between rounded-xl border px-3 py-2 transition-all hover:translate-x-[1px]"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              <XCircle size={12} style={{ color: falseColor }} />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                False
              </span>
              <span className="text-[10px] text-slate-500">Fallback path</span>
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!h-3 !w-3 !border-2 !shadow-md"
            style={{
              backgroundColor: falseColor,
              borderColor: "#0F172A",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 text-[11px]">
        <span className="text-slate-400">Decision Node</span>

        <span
          className="rounded-md px-2 py-1 font-semibold"
          style={{
            background:
              data?.status === "configured"
                ? "rgba(34,197,94,0.12)"
                : "rgba(245,158,11,0.12)",
            color: data?.status === "configured" ? "#4ADE80" : "#FBBF24",
            border:
              data?.status === "configured"
                ? "1px solid rgba(34,197,94,0.18)"
                : "1px solid rgba(245,158,11,0.18)",
          }}
        >
          {data?.status === "configured" ? "Configured" : "Draft"}
        </span>
      </div>

      {/* Input Handle */}
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

export default IfElseNode;
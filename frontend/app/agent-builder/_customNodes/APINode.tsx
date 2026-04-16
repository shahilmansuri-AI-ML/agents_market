"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Webhook, ArrowUpRight } from "lucide-react";

const APINode = ({ data }: any) => {
  const accent = "#3B82F6";

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
      {/* subtle top glow */}
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
          <Webhook size={17} style={{ color: accent }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-50">
              {data?.label || "API Request"}
            </span>

            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
          </div>

          {/* Meta */}
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(59,130,246,0.12)",
                color: "#60A5FA",
                borderColor: "rgba(59,130,246,0.28)",
              }}
            >
              API
            </span>

            <span className="truncate text-[11px] font-medium text-slate-400">
              HTTP Client
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5" />

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-1 font-semibold"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#4ADE80",
                border: "1px solid rgba(34,197,94,0.18)",
              }}
            >
              {data?.method || "GET"}
            </span>

            <span className="truncate text-slate-400">
              {data?.endpoint || "/api/resource"}
            </span>
          </div>
        </div>
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

export default APINode;
"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Play, Rocket } from "lucide-react";

interface StartNodeProps {
  data?: {
    label?: string;
  };
}

const StartNode = ({ data }: StartNodeProps) => {
  const accent = "#10B981";

  return (
    <div className="relative group">
      <div
        className="min-w-[220px] rounded-2xl border shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #111827 100%)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, rgba(16,185,129,0.2), transparent)`,
          }}
        />

        {/* Main Content */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Icon */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105"
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              borderColor: "rgba(255,255,255,0.08)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <Play size={15} style={{ color: accent }} />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-sm font-semibold tracking-tight"
              style={{ color: "#F8FAFC" }}
            >
              {data?.label || "Trigger"}
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="truncate text-[11px] font-medium"
                style={{ color: "#94A3B8" }}
              >
                Start Point
              </span>
              <Rocket size={11} className="text-emerald-400/50" />
            </div>
          </div>
        </div>

        {/* Soft bottom inner border */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/5" />

        {/* Radial Hover Glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 30% 20%, rgba(16,185,129,0.08), transparent 55%)`,
          }}
        />
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: accent,
          borderColor: "#0F172A",
          right: -6,
        }}
      />
    </div>
  );
};

export default StartNode;
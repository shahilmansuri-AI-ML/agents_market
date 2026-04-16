"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Sparkles } from "lucide-react";

interface OpenAiConfig {
  model?: "gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo" | "o1" | "o3-mini";
  mode?: "chat" | "completion" | "embedding" | "vision";
}

interface OpenAiNodeData {
  label?: string;
  config?: OpenAiConfig;
}

const DEFAULT_CONFIG: OpenAiConfig = {
  model: "gpt-4o",
  mode: "chat",
};

const modeColors: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  chat: {
    bg: "rgba(16,185,129,0.12)",
    text: "#10B981",
    border: "rgba(16,185,129,0.28)",
    glow: "rgba(16,185,129,0.10)",
  },
  completion: {
    bg: "rgba(59,130,246,0.12)",
    text: "#3B82F6",
    border: "rgba(59,130,246,0.28)",
    glow: "rgba(59,130,246,0.10)",
  },
  embedding: {
    bg: "rgba(139,92,246,0.12)",
    text: "#8B5CF6",
    border: "rgba(139,92,246,0.28)",
    glow: "rgba(139,92,246,0.10)",
  },
  vision: {
    bg: "rgba(245,158,11,0.12)",
    text: "#F59E0B",
    border: "rgba(245,158,11,0.28)",
    glow: "rgba(245,158,11,0.10)",
  },
};

const modelLabel: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-3.5-turbo": "GPT-3.5",
  o1: "o1",
  "o3-mini": "o3-mini",
};

export default function OpenAiNode({ data }: { data: OpenAiNodeData }) {
  const config = { ...DEFAULT_CONFIG, ...(data.config ?? {}) };
  const mode = modeColors[config.mode ?? "chat"];
  const model = modelLabel[config.model ?? "gpt-4o"] ?? config.model;

  return (
    <div className="relative group">
      <div
        className="min-w-[250px] overflow-hidden rounded-2xl border shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        style={{
          background: "linear-gradient(180deg, #0B0F17 0%, #111827 100%)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Accent shimmer */}
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(255,255,255,0.03))",
                borderColor: "rgba(255,255,255,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <Sparkles size={16} className="text-white/90" />
            </div>

            {/* Title + model */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight text-slate-50">
                {data.label || "OpenAI"}
              </div>

              <div className="mt-1">
                <span className="inline-flex rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  {model}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Row */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: mode.text,
                  boxShadow: `0 0 12px ${mode.glow}`,
                }}
              />
              <span
                className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  background: mode.bg,
                  color: mode.text,
                  borderColor: mode.border,
                }}
              >
                {config.mode}
              </span>

              <span className="ml-auto text-[10px] font-mono text-slate-500">
                model active
              </span>
            </div>
          </div>
        </div>

        {/* Hover glow */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/[0.015] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.8)",
          borderColor: "#0B0F17",
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.8)",
          borderColor: "#0B0F17",
          right: -6,
        }}
      />
    </div>
  );
}
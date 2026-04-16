"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Bot, Shield } from "lucide-react";

interface AgentConfig {
  model_id?: string;
  model_label?: string;
  provider?: string;
  tool?: string;
  // legacy fields kept for backward compat
  model?: string;
}

interface AgentNodeData {
  label?: string;
  config?: AgentConfig;
  status?: "configured" | "draft";
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini:    "#60A5FA",
  groq:      "#FCD34D",
  openai:    "#34D399",
  anthropic: "#FB923C",
  deepseek:  "#C084FC",
};

const DEFAULT_CONFIG: AgentConfig = { provider: "", model_id: "", tool: "" };

export default function AgentNode({ data }: { data: AgentNodeData }) {
  const config = { ...DEFAULT_CONFIG, ...(data.config ?? {}) };
  const accent = "#3B82F6";

  const displayModel = config.model_label || config.model_id || config.model || "No model";
  const providerName = config.provider || "";
  const providerColor = PROVIDER_COLORS[providerName] ?? "#94A3B8";
  const isConfigured = !!(config.model_id || config.model);

  return (
    <div
      className="rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: "linear-gradient(145deg, #0F172A, #020617)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isConfigured ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.08)",
        minWidth: 180,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${isConfigured ? providerColor : accent}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(59,130,246,0.15)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(59,130,246,0.25)",
          }}
        >
          <Bot size={18} style={{ color: "#3B82F6" }} />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className="text-sm font-semibold truncate block"
            style={{ color: "#F8FAFC", letterSpacing: "0.2px" }}
          >
            {data.label || "Agent"}
          </span>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Provider badge */}
            {providerName ? (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                style={{
                  background: `${providerColor}22`,
                  color: providerColor,
                  border: `1px solid ${providerColor}44`,
                }}
              >
                {providerName}
              </span>
            ) : (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(148,163,184,0.15)",
                  color: "#94A3B8",
                  border: "1px solid rgba(148,163,184,0.3)",
                }}
              >
                NO PROVIDER
              </span>
            )}

            {/* Fallback shield badge if configured */}
            {isConfigured && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#4ADE80",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <Shield size={8} />
                3-layer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

      {/* Footer */}
      <div className="px-4 py-2 text-[10px] flex justify-between items-center gap-2">
        <span
          className="truncate font-mono"
          style={{ color: isConfigured ? "#CBD5E1" : "#64748B", maxWidth: 120 }}
        >
          {displayModel}
        </span>
        <span style={{ color: "#334155", flexShrink: 0 }}>AI Node</span>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{ backgroundColor: "#3B82F6", borderColor: "#020617" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{ backgroundColor: "#3B82F6", borderColor: "#020617" }}
      />
    </div>
  );
}
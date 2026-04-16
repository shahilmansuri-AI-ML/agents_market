"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Mail } from "lucide-react";

interface MailConfig {
  provider: "gmail" | "outlook" | "custom";
  email?: string;
}

interface MailNodeData {
  label?: string;
  config?: MailConfig;
}

const DEFAULT_CONFIG: MailConfig = {
  provider: "gmail",
  email: "user@example.com",
};

const providerMeta: Record<
  string,
  {
    label: string;
    accent: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    topBar: string;
  }
> = {
  gmail: {
    label: "Gmail",
    accent: "#EA4335",
    border: "rgba(234,67,53,0.25)",
    badgeBg: "rgba(234,67,53,0.12)",
    badgeText: "#EA4335",
    topBar:
      "linear-gradient(90deg, #4285F4 0%, #EA4335 40%, #FBBC04 70%, #34A853 100%)",
  },
  outlook: {
    label: "Outlook",
    accent: "#0078D4",
    border: "rgba(0,120,212,0.25)",
    badgeBg: "rgba(0,120,212,0.12)",
    badgeText: "#28A8E8",
    topBar: "linear-gradient(90deg, #0078D4, #28A8E8)",
  },
  custom: {
    label: "Mail",
    accent: "#A3A3A3",
    border: "rgba(163,163,163,0.2)",
    badgeBg: "rgba(163,163,163,0.10)",
    badgeText: "#A3A3A3",
    topBar: "linear-gradient(90deg, #737373, #A3A3A3)",
  },
};

export default function MailNode({ data }: { data: MailNodeData }) {
  const config = { ...DEFAULT_CONFIG, ...(data.config ?? {}) };
  const meta = providerMeta[config.provider] ?? providerMeta.custom;

  return (
    <div className="relative group">
      <div
        className="min-w-[250px] overflow-hidden rounded-2xl border shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #111827 100%)",
          borderColor: meta.border,
        }}
      >
        {/* Accent bar */}
        <div className="h-[2px] w-full" style={{ background: meta.topBar }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(180deg, rgba(15,23,42,0.95), ${meta.badgeText}12)`,
                borderColor: `${meta.badgeText}22`,
              }}
            >
              <Mail size={16} style={{ color: meta.badgeText }} />
            </div>

            {/* Title + Badge */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight text-slate-50">
                {data.label || meta.label}
              </div>

              <div className="mt-1">
                <span
                  className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    background: meta.badgeBg,
                    color: meta.badgeText,
                    borderColor: `${meta.badgeText}30`,
                  }}
                >
                  {config.provider}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: meta.badgeText }}
              >
                @
              </span>
              <span className="truncate text-[11px] font-mono text-slate-400">
                {config.email}
              </span>
            </div>
          </div>
        </div>

        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${meta.badgeText}12, transparent 55%)`,
          }}
        />
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: meta.badgeText,
          borderColor: "#0F172A",
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: meta.badgeText,
          borderColor: "#0F172A",
          right: -6,
        }}
      />
    </div>
  );
}
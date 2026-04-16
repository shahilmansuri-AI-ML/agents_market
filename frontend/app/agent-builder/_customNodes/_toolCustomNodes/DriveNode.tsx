"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { FolderOpen } from "lucide-react";

interface DriveConfig {
  provider: "google" | "dropbox" | "custom";
  path?: string;
}

interface DriveNodeData {
  label?: string;
  config?: DriveConfig;
}

const DEFAULT_CONFIG: DriveConfig = {
  provider: "google",
  path: "/my-drive",
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
    icon: React.ReactNode;
  }
> = {
  google: {
    label: "Google Drive",
    accent: "#4285F4",
    border: "rgba(66,133,244,0.25)",
    badgeBg: "rgba(66,133,244,0.12)",
    badgeText: "#4285F4",
    topBar:
      "linear-gradient(90deg, #4285F4 0%, #34A853 33%, #FBBC04 66%, #EA4335 100%)",
    icon: (
      <svg width="18" height="16" viewBox="0 0 87 78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.2 66.5L15.5 82.5H71.5L80.8 66.5H6.2Z" fill="#1967D2" />
        <path d="M43.5 0L6.2 66.5H28.8L43.5 40.5L58.2 66.5H80.8L43.5 0Z" fill="#4285F4" />
        <path d="M6.2 66.5L28.8 66.5L43.5 40.5L29 14L6.2 66.5Z" fill="#0F9D58" />
        <path d="M43.5 0L29 14L43.5 40.5L58 14L43.5 0Z" fill="#FBBC04" />
        <path d="M58 14L43.5 40.5L58.2 66.5H80.8L58 14Z" fill="#EA4335" />
      </svg>
    ),
  },
  dropbox: {
    label: "Dropbox",
    accent: "#0061FF",
    border: "rgba(0,97,255,0.25)",
    badgeBg: "rgba(0,97,255,0.12)",
    badgeText: "#0061FF",
    topBar: "linear-gradient(90deg, #0061FF, #2B7FFF)",
    icon: (
      <svg width="18" height="16" viewBox="0 0 526 458" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M131.6 0L0 84.9L131.6 169.8L263.2 84.9L131.6 0Z" fill="#0061FF" />
        <path d="M394.8 0L263.2 84.9L394.8 169.8L526.4 84.9L394.8 0Z" fill="#0061FF" />
        <path d="M0 254.7L131.6 339.6L263.2 254.7L131.6 169.8L0 254.7Z" fill="#0061FF" />
        <path d="M263.2 254.7L394.8 339.6L526.4 254.7L394.8 169.8L263.2 254.7Z" fill="#0061FF" />
        <path d="M131.6 365.2L263.2 450.1L394.8 365.2L263.2 280.3L131.6 365.2Z" fill="#0061FF" />
      </svg>
    ),
  },
  custom: {
    label: "Custom Storage",
    accent: "#A3A3A3",
    border: "rgba(163,163,163,0.2)",
    badgeBg: "rgba(163,163,163,0.10)",
    badgeText: "#A3A3A3",
    topBar: "linear-gradient(90deg, #737373, #A3A3A3)",
    icon: (
      <svg width="18" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="#A3A3A3" strokeWidth="2" />
        <path d="M8 21h8M12 17v4" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
};

export default function DriveNode({ data }: { data: DriveNodeData }) {
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
        {/* Top Accent */}
        <div className="h-[2px] w-full" style={{ background: meta.topBar }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105"
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                borderColor: `${meta.badgeText}22`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              {meta.icon}
            </div>

            {/* Title + Badge */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight text-slate-50">
                {data.label || meta.label}
              </div>

              <div className="mt-1 flex items-center gap-2">
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

          {/* Path */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} style={{ color: meta.badgeText }} />
              <span className="truncate text-[11px] font-mono text-slate-400">
                {config.path}
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
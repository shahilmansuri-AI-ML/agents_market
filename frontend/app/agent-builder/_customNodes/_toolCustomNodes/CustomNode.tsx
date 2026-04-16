"use client";

import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Check, Pencil, Puzzle } from "lucide-react";

interface CustomNodeData {
  label?: string;
  color?: string;
  description?: string;
  onUpdate?: (updates: {
    label?: string;
    description?: string;
    color?: string;
  }) => void;
}

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#F97316",
  "#EC4899",
];

export default function CustomNode({ data }: { data: CustomNodeData }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label || "Custom Tool");
  const [description, setDescription] = useState(
    data.description || "User-defined tool"
  );
  const [color, setColor] = useState(data.color || "#F59E0B");

  const [editLabel, setEditLabel] = useState(label);
  const [editDesc, setEditDesc] = useState(description);

  useEffect(() => {
    setLabel(data.label || "Custom Tool");
    setDescription(data.description || "User-defined tool");
    setColor(data.color || "#F59E0B");
    setEditLabel(data.label || "Custom Tool");
    setEditDesc(data.description || "User-defined tool");
  }, [data.label, data.description, data.color]);

  const handleSave = () => {
    const nextLabel = editLabel.trim() || "Custom Tool";
    const nextDesc = editDesc.trim() || "User-defined tool";

    setLabel(nextLabel);
    setDescription(nextDesc);
    setEditing(false);

    data?.onUpdate?.({
      label: nextLabel,
      description: nextDesc,
      color,
    });
  };

  const handleColorChange = (nextColor: string) => {
    setColor(nextColor);
    data?.onUpdate?.({
      label,
      description,
      color: nextColor,
    });
  };

  return (
    <div className="relative group">
      <div
        className="min-w-[250px] rounded-2xl border overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #111827 100%)",
          borderColor: `${color}22`,
        }}
      >
        {/* Accent line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105"
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                borderColor: `${color}33`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <Puzzle size={17} style={{ color }} />
            </div>

            {/* Title / Badge */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-full rounded-md border bg-black/20 px-2 py-1 text-sm font-semibold text-slate-50 outline-none"
                  style={{ borderColor: `${color}55` }}
                />
              ) : (
                <div className="truncate text-sm font-semibold tracking-tight text-slate-50">
                  {label}
                </div>
              )}

              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color,
                    background: `${color}14`,
                    borderColor: `${color}30`,
                  }}
                >
                  Custom
                </span>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
              style={{
                background: editing ? `${color}14` : "rgba(255,255,255,0.03)",
                borderColor: editing ? `${color}40` : "rgba(255,255,255,0.08)",
              }}
              title={editing ? "Save" : "Edit"}
            >
              {editing ? (
                <Check size={14} style={{ color }} />
              ) : (
                <Pencil size={14} className="text-slate-400" />
              )}
            </button>
          </div>

          {/* Description */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            {editing ? (
              <input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-full bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-500"
                placeholder="Describe this tool..."
              />
            ) : (
              <p className="text-[11px] leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>

          {/* Color picker */}
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Accent Color
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className="h-5 w-5 rounded-full border-2 transition-all duration-200"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#ffffff" : "transparent",
                    boxShadow: color === c ? `0 0 0 3px ${c}22` : "none",
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${color}12, transparent 55%)`,
          }}
        />
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: color,
          borderColor: "#0F172A",
          left: -6,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !shadow-md"
        style={{
          backgroundColor: color,
          borderColor: "#0F172A",
          right: -6,
        }}
      />
    </div>
  );
}
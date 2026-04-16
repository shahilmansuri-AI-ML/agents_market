"use client";

import { useContext, useMemo, useState, useEffect } from "react";
import WorkflowContext from "@/app/context/WorkflowContext";
import {
  MousePointer2,
  Square,
  GitBranch,
  Repeat,
  Radio,
  Plus,
  Layers,
  Search,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolConfig = {
  name: string;
  icon: LucideIcon;
  type: string;
  color: string;
  description: string;
};

const AGENT_TOOLS: ToolConfig[] = [
  { name: "Agent", icon: MousePointer2, type: "AgentNode", color: "#3B82F6", description: "Autonomous task runner" },
  { name: "End", icon: Square, type: "EndNode", color: "#EF4444", description: "Terminate flow" },
  { name: "If / Else", icon: GitBranch, type: "IfElseNode", color: "#F59E0B", description: "Conditional branch" },
  { name: "While", icon: Repeat, type: "LoopNode", color: "#8B5CF6", description: "Loop until condition" },
  { name: "API", icon: Radio, type: "APINode", color: "#06B6D4", description: "External HTTP request" },
];

export default function AgentToolsPanel() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("WorkflowContext missing");

  const { setNodes } = context;

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setMounted(true), []);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AGENT_TOOLS;
    return AGENT_TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.type.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q)
    );
  }, [search]);

  const createNode = (tool: ToolConfig, offset = 150) => {
    const id = `${tool.type}-${Date.now()}`;
    setNodes((prev: any[]) => [
      ...prev,
      {
        id,
        position: { x: prev.length * 20 + offset, y: prev.length * 20 + offset },
        data: { label: tool.name, accentColor: tool.color },
        type: tool.type,
      },
    ]);
    setRecentlyAdded(id);
    setTimeout(() => setRecentlyAdded(null), 1200);
  };

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap");

        :root {
          --bg: #080b0f;
          --surface: #0d1117;
          --surface-2: #161b22;
          --surface-3: #11161d;
          --border: rgba(255, 255, 255, 0.06);
          --border-strong: rgba(255, 255, 255, 0.1);
          --accent: #3b82f6;
          --text-primary: #f0f6fc;
          --text-secondary: #7d8590;
          --text-muted: #8b949e;
        }

        .tools-panel { font-family: "Syne", sans-serif; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseSoft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.15); }
        }

        .animate-fadeSlide { animation: fadeSlide 0.2s ease; }
        .animate-pulseSoft { animation: pulseSoft 1.4s ease-in-out infinite; }

        .search-collapse {
          overflow: hidden;
          transition: max-height 0.25s ease, opacity 0.2s ease, margin-bottom 0.25s ease;
        }
        .search-collapse.open {
          max-height: 50px;
          opacity: 1;
          margin-bottom: 8px;
        }
        .search-collapse.closed {
          max-height: 0;
          opacity: 0;
          margin-bottom: 0;
        }

        .tool-info-collapse {
          overflow: hidden;
          white-space: nowrap;
          transition: max-width 0.25s ease, opacity 0.2s ease;
        }
        .tool-info-collapse.open {
          max-width: 140px;
          opacity: 1;
        }
        .tool-info-collapse.closed {
          max-width: 0;
          opacity: 0;
        }

        .header-label-collapse {
          overflow: hidden;
          white-space: nowrap;
          transition: max-width 0.25s ease, opacity 0.2s ease;
        }
        .header-label-collapse.open {
          max-width: 160px;
          opacity: 1;
        }
        .header-label-collapse.closed {
          max-width: 0;
          opacity: 0;
        }

        .plus-collapse {
          overflow: hidden;
          transition: max-width 0.2s ease, opacity 0.15s ease;
          flex-shrink: 0;
        }
        .plus-collapse.open {
          max-width: 30px;
          opacity: 1;
        }
        .plus-collapse.closed {
          max-width: 0;
          opacity: 0;
        }

        .pulse-collapse {
          overflow: hidden;
          transition: max-width 0.2s ease, opacity 0.2s ease;
        }
        .pulse-collapse.open {
          max-width: 20px;
          opacity: 1;
          margin-left: auto;
        }
        .pulse-collapse.closed {
          max-width: 0;
          opacity: 0;
          margin-left: 0;
        }

        .toggle-btn {
          position: absolute;
          top: 50%;
          right: -11px;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--surface-2);
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          color: var(--text-secondary);
          transition: background 0.2s, color 0.2s;
        }
        .toggle-btn:hover {
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent);
        }
        .toggle-icon {
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div
        className="tools-panel relative overflow-visible"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          width: collapsed ? "56px" : "224px",
          transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
          flexShrink: 0,
        }}
      >
        {/* Background Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          borderRadius: "14px",
          overflow: "hidden",
        }} />

        {/* Glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.06), transparent 72%)",
        }} />

        {/* Accent Line */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "3px", height: "100%",
          background: "rgba(59,130,246,0.42)", borderRadius: "14px 0 0 14px", zIndex: 1,
        }} />

        {/* Toggle Button */}
        <div
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand panel" : "Collapse panel"}
        >
          <ChevronLeft
            size={12}
            className="toggle-icon"
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 2, padding: "12px", overflow: "hidden" }}>

          {/* Header */}
          <div style={{
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.01)",
            margin: "-12px -12px 10px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "40px",
            overflow: "hidden",
          }}>
            <Layers size={13} color="var(--accent)" style={{ flexShrink: 0 }} />

            <span
              className={`header-label-collapse ${collapsed ? "closed" : "open"}`}
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              Node Library
            </span>

            <div className={`pulse-collapse ${collapsed ? "closed" : "open"}`}>
              <div
                className="animate-pulseSoft"
                style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>

          {/* Search */}
          <div className={`search-collapse ${collapsed ? "closed" : "open"}`}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute", left: "10px", top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="w-full rounded-[10px] border bg-transparent outline-none"
                style={{
                  height: "34px", padding: "0 10px 0 30px",
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)", fontSize: "12px",
                }}
              />
            </div>
          </div>

          {/* Tools List */}
          <div
            className="animate-fadeSlide"
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            {!collapsed && filteredTools.length === 0 ? (
              <div style={{
                border: "1px dashed var(--border)", borderRadius: "10px",
                padding: "16px 10px", textAlign: "center",
                background: "rgba(255,255,255,0.015)",
              }}>
                <Wrench size={15} style={{ margin: "0 auto 6px", color: "var(--text-secondary)" }} />
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  No nodes found
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Try a different keyword
                </div>
              </div>
            ) : (
              (collapsed ? AGENT_TOOLS : filteredTools).map((tool) => {
                const Icon = tool.icon;
                const isRecent = recentlyAdded?.startsWith(tool.type);
                return (
                  <button
                    key={tool.type}
                    type="button"
                    onClick={() => createNode(tool)}
                    title={collapsed ? `${tool.name} — ${tool.description}` : tool.description}
                    className={cn(
                      "group relative w-full text-left transition-all duration-200",
                      "hover:-translate-y-[1px]"
                    )}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: collapsed ? "center" : "space-between",
                      padding: collapsed ? "8px 0" : "8px 10px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: isRecent ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
                      border: isRecent
                        ? "1px solid rgba(59,130,246,0.18)"
                        : "1px solid var(--border)",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Left: Icon + Text */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: collapsed ? "0px" : "9px",
                      minWidth: 0,
                      overflow: "hidden",
                      flex: collapsed ? "unset" : 1,
                    }}>
                      {/* Icon Box */}
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.32)",
                        border: "1px solid var(--border)",
                        color: tool.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `inset 0 0 0 1px ${tool.color}15`,
                      }}>
                        <Icon size={14} />
                      </div>

                      {/* Text Info */}
                      <div className={`tool-info-collapse ${collapsed ? "closed" : "open"}`}>
                        <div style={{
                          fontSize: "12px", fontWeight: 600,
                          color: "var(--text-primary)", lineHeight: 1.2,
                        }}>
                          {tool.name}
                        </div>
                        <div style={{
                          fontSize: "10px",
                          fontFamily: "'DM Mono', monospace",
                          color: "var(--text-secondary)",
                          opacity: 0.75,
                          lineHeight: 1.2,
                          marginTop: "2px",
                        }}>
                          {tool.type}
                        </div>
                      </div>
                    </div>

                    {/* Plus Button */}
                    <div className={`plus-collapse ${collapsed ? "closed" : "open"}`}>
                      <div
                        className="transition-all duration-200 group-hover:scale-105"
                        style={{
                          width: "22px", height: "22px", borderRadius: "7px",
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.02)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Plus size={11} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>
      </div>
    </>
  );
}
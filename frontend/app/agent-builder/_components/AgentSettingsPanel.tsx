"use client";

import { useContext, useEffect, useState } from "react";
import WorkflowContext from "@/app/context/WorkflowContext";

import AgentSettings from "../_nodeSettings/AgentNodeSettings";
import IfElseNodeSettings from "../_nodeSettings/IfElseNodeSettings";
import LoopNodeSettings from "../_nodeSettings/LoopNodeSettings";
import ApiNodeSettings from "../_nodeSettings/ApiNodeSettings";

import { Settings, CheckCircle, Pencil } from "lucide-react";

export default function AgentSettingsPanel() {
  const context = useContext(WorkflowContext);
  if (!context) return null;

  const { selectedNode, setNodes } = context;

  const [mounted, setMounted] = useState(false);
  const [savedNodes, setSavedNodes] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const onUpdateNodeData = (formData: any) => {
    if (!selectedNode || !formData) return;

    const nodeId = selectedNode.id;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: formData.name ?? node.data?.label ?? selectedNode.type,
                config: formData,
              },
            }
          : node,
      ),
    );

    try {
      localStorage.setItem(`node-config-${nodeId}`, JSON.stringify(formData));
    } catch (err) {
      console.error("LocalStorage save failed:", err);
    }

    setSavedNodes((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  };

  const isAlreadySaved = selectedNode && savedNodes.has(selectedNode.id);

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

        .settings-panel { font-family: "Syne", sans-serif; }

        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseSoft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.65; transform: scale(1.15); }
        }

        .animate-fadeSlide { animation: fadeSlide 0.2s ease; }
        .animate-pulseSoft { animation: pulseSoft 1.4s ease-in-out infinite; }

        .settings-panel .panel-input,
        .settings-panel .panel-select {
          width: 100%;
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-family: "Syne", sans-serif;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .settings-panel .panel-input:focus,
        .settings-panel .panel-select:focus {
          border-color: rgba(59, 130, 246, 0.35);
          background: rgba(59, 130, 246, 0.04);
        }

        .settings-panel .panel-label {
          font-size: 10px;
          font-family: "DM Mono", monospace;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 4px;
          letter-spacing: 0.06em;
        }

        .settings-panel .save-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 10px;
          cursor: pointer;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.22);
          color: #93bbfd;
          font-family: "Syne", sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          transition: all 0.2s;
        }

        .settings-panel .save-btn:hover {
          background: rgba(59, 130, 246, 0.16);
          transform: translateY(-1px);
        }

        .settings-panel .edit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-strong);
          color: var(--text-primary);
          font-family: "Syne", sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          transition: all 0.2s;
        }

        .settings-panel .edit-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }
      `}</style>

      <div
        className="settings-panel relative overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          top:"-12px",
          right: "-12px",
          width: "350px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
        }}
      >
        {/* Background Grid */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.06), transparent 72%)",
          }}
        />

        {/* Accent Line */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "3px", height: "100%",
            background: "rgba(59,130,246,0.42)", borderRadius: "14px 0 0 14px", zIndex: 1,
          }}
        />

        <div style={{ position: "relative", zIndex: 2, padding: "12px" }}>

          {/* Header */}
          <div
            style={{
              borderBottom: "1px solid var(--border)",
              background: "rgba(255,255,255,0.01)",
              margin: "-12px -12px 12px",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Settings size={13} color="var(--accent)" />
            <span
              style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "var(--text-secondary)",
              }}
            >
              Configuration Panel
            </span>
            <div
              className="animate-pulseSoft"
              style={{
                marginLeft: "auto", width: "6px", height: "6px",
                borderRadius: "50%", background: "var(--accent)",
              }}
            />
          </div>

          {/* Empty State */}
          {!selectedNode && (
            <div className="animate-fadeSlide" style={{ textAlign: "center", padding: "16px 0" }}>
              <Settings size={20} style={{ margin: "0 auto 8px", color: "var(--text-secondary)", opacity: 0.5 }} />
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                No node selected
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Click a node to configure it
              </div>
            </div>
          )}

          {/* Already Saved State */}
          {isAlreadySaved && (
            <div
              className="animate-fadeSlide"
              style={{
                display: "flex", flexDirection: "column", gap: "10px",
                padding: "10px", borderRadius: "10px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Saved Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <CheckCircle size={13} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    Node configured
                  </div>
                  <div
                    style={{
                      fontSize: "10px", fontFamily: "'DM Mono', monospace",
                      color: "var(--text-secondary)", opacity: 0.75, lineHeight: 1.2, marginTop: "2px",
                    }}
                  >
                    {selectedNode!.type}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                This node has been saved. Click below to edit its settings.
              </p>

              <button
                className="edit-btn"
                onClick={() =>
                  setSavedNodes((prev) => {
                    const next = new Set(prev);
                    next.delete(selectedNode!.id);
                    return next;
                  })
                }
              >
                <Pencil size={11} />
                Edit Settings
              </button>
            </div>
          )}

          {/* Form (unsaved nodes) */}
          {!isAlreadySaved && selectedNode && (
            <div className="animate-fadeSlide">
              {/* Section label */}
              <div
                style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "10px",
                }}
              >
                {selectedNode.type}
              </div>

              {selectedNode.type === "AgentNode" && (
                <AgentSettings selectedNode={selectedNode} updateFormData={onUpdateNodeData} />
              )}
              {selectedNode.type === "IfElseNode" && (
                <IfElseNodeSettings selectedNode={selectedNode} updateFormData={onUpdateNodeData} />
              )}
              {selectedNode.type === "LoopNode" && (
                <LoopNodeSettings selectedNode={selectedNode} updateFormData={onUpdateNodeData} />
              )}
              {selectedNode.type === "APINode" && (
                <ApiNodeSettings selectedNode={selectedNode} updateFormData={onUpdateNodeData} />
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
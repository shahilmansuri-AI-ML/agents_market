"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Rocket,
  Play,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  GitBranch,
  FileCode2,
} from "lucide-react";

type AgentStatus = "draft" | "active" | "deploying" | "error";

type HeaderProps = {
  agentName: string;
  agentId: string;
  status?: AgentStatus;
  isPublishLoading?: boolean;
  onPublish?: () => void;
  showRun?: boolean;
  isRunLoading?: boolean;
  onRun?: () => void;
  backHref?: string;
};

const statusConfig: Record<
  AgentStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon?: React.ReactNode;
  }
> = {
  draft: {
    label: "Draft",
    bg: "rgba(245,158,11,0.08)",
    text: "#F59E0B",
    border: "rgba(245,158,11,0.2)",
    dot: "#F59E0B",
  },
  active: {
    label: "Active",
    bg: "rgba(34,197,94,0.08)",
    text: "#22C55E",
    border: "rgba(34,197,94,0.2)",
    dot: "#22C55E",
  },
  deploying: {
    label: "Deploying",
    bg: "rgba(59,130,246,0.08)",
    text: "#3B82F6",
    border: "rgba(59,130,246,0.2)",
    dot: "#3B82F6",
    icon: (
      <Loader2
        style={{ width: 10, height: 10, animation: "headerSpin 1s linear infinite" }}
      />
    ),
  },
  error: {
    label: "Error",
    bg: "rgba(239,68,68,0.08)",
    text: "#EF4444",
    border: "rgba(239,68,68,0.2)",
    dot: "#EF4444",
    icon: <AlertTriangle style={{ width: 10, height: 10 }} />,
  },
};

const Header = ({
  agentName,
  agentId,
  status = "draft",
  isPublishLoading = false,
  onPublish,
  showRun = false,
  isRunLoading = false,
  onRun,
  backHref = "/dashboard",
}: HeaderProps) => {
  const [copied, setCopied] = useState(false);

  const safeAgentName = useMemo(
    () => agentName?.trim() || "Untitled Agent",
    [agentName]
  );
  const safeAgentId = useMemo(
    () => agentId?.trim() || "unassigned",
    [agentId]
  );
  const shortAgentId = useMemo(() => {
    if (!safeAgentId || safeAgentId === "unassigned") return safeAgentId;
    return `${safeAgentId.slice(0, 6)}...${safeAgentId.slice(-4)}`;
  }, [safeAgentId]);

  const s = statusConfig[status];

  const handleCopy = async () => {
    if (!safeAgentId || safeAgentId === "unassigned") return;
    try {
      await navigator.clipboard.writeText(safeAgentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap");

        @keyframes headerSpin { to { transform: rotate(360deg); } }
        @keyframes headerPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }

        .hdr-back:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.14) !important;
          color: #f0f6fc !important;
        }
        .hdr-run:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.16) !important;
        }
        .hdr-copy:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #f0f6fc !important;
        }
        .hdr-publish:not(:disabled):hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          background: "rgba(8,11,15,0.94)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 35%, rgba(99,102,241,0.4) 65%, transparent 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            minHeight: 68,
            gap: 16,
            maxWidth: "100%",
          }}
        >
          {/* ── LEFT ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
              flex: 1,
            }}
          >
            {/* Back button */}
            <Link
              href={backHref}
              className="hdr-back"
              aria-label="Back"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36, height: 36,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                color: "#7D8590",
                flexShrink: 0,
                transition: "all 0.2s",
                textDecoration: "none",
              }}
            >
              <ChevronLeft size={16} />
            </Link>

            {/* Divider */}
            <div
              style={{
                width: 1, height: 34,
                background: "rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            />

            {/* Icon + name block */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>

              {/* Agent icon */}
              <div
                style={{
                  width: 38, height: 38,
                  borderRadius: 11,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(59,130,246,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 0 20px rgba(59,130,246,0.1)",
                }}
              >
                <GitBranch size={16} color="#60A5FA" />
              </div>

              {/* Text */}
              <div style={{ minWidth: 0 }}>

                {/* Agent name + status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h1
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#F0F6FC",
                      margin: 0,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 360,
                    }}
                  >
                    {safeAgentName}
                  </h1>

                  {/* Status badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      color: s.text,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {s.icon ? (
                      <span style={{ color: s.text, display: "flex" }}>{s.icon}</span>
                    ) : (
                      <span
                        style={{
                          width: 5, height: 5,
                          borderRadius: "50%",
                          background: s.dot,
                          flexShrink: 0,
                          animation:
                            status === "active"
                              ? "headerPulseDot 2s ease-in-out infinite"
                              : "none",
                        }}
                      />
                    )}
                    {s.label}
                  </div>
                </div>

                {/* Agent ID — small & subtle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#374151",
                    }}
                  >
                    ID
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 5,
                      padding: "1px 5px 1px 7px",
                    }}
                  >
                    <code
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: "#4B5563",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {shortAgentId}
                    </code>

                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={safeAgentId === "unassigned"}
                      className="hdr-copy"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: safeAgentId === "unassigned" ? "not-allowed" : "pointer",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 16, height: 16,
                        borderRadius: 3,
                        padding: 0,
                        transition: "all 0.15s",
                        opacity: safeAgentId === "unassigned" ? 0.4 : 1,
                      }}
                      aria-label="Copy Agent ID"
                    >
                      {copied
                        ? <Check size={10} color="#22C55E" />
                        : <Copy size={10} />
                      }
                    </button>
                  </div>

                  {copied && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "#22C55E",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── CENTER: builder label ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
            className="hidden lg:flex"
          >
            <FileCode2 size={12} color="#374151" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#4B5563",
              }}
            >
              Multi-Agent Builder
            </span>
          </div>

          {/* ── RIGHT: actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

            {/* Run */}
            {showRun && (
              <button
                onClick={onRun}
                disabled={isRunLoading || status === "deploying"}
                className="hdr-run"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#f0f6fc",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: isRunLoading || status === "deploying" ? "not-allowed" : "pointer",
                  opacity: isRunLoading || status === "deploying" ? 0.5 : 1,
                  transition: "all 0.2s",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {isRunLoading
                  ? <Loader2 size={13} style={{ animation: "headerSpin 1s linear infinite" }} />
                  : <Play size={13} color="#A3E635" fill="#A3E635" />
                }
                {isRunLoading ? "Opening..." : "Run"}
              </button>
            )}

            {/* Publish */}
            <button
              onClick={onPublish}
              disabled={isPublishLoading || status === "deploying"}
              className="hdr-publish"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 38,
                padding: "0 18px",
                borderRadius: 10,
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: isPublishLoading || status === "deploying" ? "not-allowed" : "pointer",
                opacity: isPublishLoading || status === "deploying" ? 0.6 : 1,
                transition: "all 0.2s",
                ...(status === "active"
                  ? {
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      color: "#22C55E",
                      boxShadow: "none",
                    }
                  : status === "error"
                  ? {
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#EF4444",
                      boxShadow: "none",
                    }
                  : {
                      background: "rgba(59,130,246,0.9)",
                      border: "1px solid rgba(59,130,246,0.5)",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(59,130,246,0.28)",
                    }),
              }}
            >
              {isPublishLoading || status === "deploying"
                ? <Loader2 size={13} style={{ animation: "headerSpin 1s linear infinite" }} />
                : <Rocket size={13} />
              }
              {status === "deploying"
                ? "Publishing..."
                : status === "active"
                ? "Published"
                : "Publish"
              }
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
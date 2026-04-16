"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  Filter,
  Loader2,
  Bot,
  Layers,
  Zap,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api-client";

/* ================= TYPES ================= */

export type Tool = {
  tool_id: number;
  tool_name: string;
};

type AgentBase = {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status?: string;
  type: "single" | "multi";
  agent_type?: "single" | "multi";
};

export type SingleAgent = AgentBase & {
  type: "single";
  instruction?: string;
  tool: Tool | null;
};

export type MultiAgent = AgentBase & {
  type: "multi";
  tags: string[] | null;
};

export type Agent = SingleAgent | MultiAgent;

/* ================= COMPONENT ================= */

const AgentRegistry = () => {
  const [singleAgents, setSingleAgents] = useState<SingleAgent[]>([]);
  const [multiAgents, setMultiAgents] = useState<MultiAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [subFilter, setSubFilter] = useState("all");
  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [undeployingAgentId, setUndeployingAgentId] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ================= STATUS BADGE ================= */

  const getStatusClasses = (status?: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "deployed":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20";
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "inactive":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-[#7D8590]/10 text-[#7D8590] border-[#7D8590]/20";
    }
  };

  const isAgentDeployed = (agent: Agent) =>
    (agent.status ?? "").trim().toUpperCase() === "DEPLOYED";

  const updateAgentStatus = (agentId: string, status: string) => {
    const update = <T extends { id: string; status?: string }>(list: T[]) =>
      list.map((a) => (a.id === agentId ? { ...a, status } : a));
    setAgents((prev) => update(prev));
    setSingleAgents((prev) => update(prev));
    setMultiAgents((prev) => update(prev));
  };

  const removeAgentFromState = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    setSingleAgents((prev) => prev.filter((a) => a.id !== agentId));
    setMultiAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  /* ================= DEPLOY ================= */
  const handleDeploy = async (agent: Agent) => {
    if (!agent?.id) { alert("Agent ID is missing."); return; }
    const tenantId =
      agent.tenant_id ||
      (typeof window !== "undefined" ? localStorage.getItem("tenant_id") : null);
    if (!tenantId) { alert("Tenant ID is missing."); return; }

    setDeployingAgentId(agent.id);
    try {
      await api.post(
        "/deployments/deploy-agent",
        { agent_id: agent.id, tenant_id: tenantId, agent_type: agent.type },
        { requireAuth: true, requireTenant: true }
      );
      updateAgentStatus(agent.id, "DEPLOYED");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Deployment failed.");
    } finally {
      setDeployingAgentId(null);
    }
  };

  /* ================= UNDEPLOY (single) ================= */
  const handleUndeploy = async (agent: Agent) => {
    if (!agent?.id) { alert("Agent ID is missing."); return; }
    setUndeployingAgentId(agent.id);
    try {
      await api.patch(`/single_agents/${agent.id}/undeploy`, {}, { requireAuth: true, requireTenant: true });
      updateAgentStatus(agent.id, "DRAFT");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Undeploy failed.");
    } finally {
      setUndeployingAgentId(null);
    }
  };

  /* ================= UNDEPLOY (multi) ================= */
  const handleMultiUndeploy = async (agent: Agent) => {
    if (!agent?.id) { alert("Agent ID is missing."); return; }
    setUndeployingAgentId(agent.id);
    try {
      await api.patch(
        `/multi_agents/${agent.id}/undeploy`,
        { status: "PENDING" },
        { requireAuth: true, requireTenant: true }
      );
      updateAgentStatus(agent.id, "PENDING");
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Undeploy failed.");
    } finally {
      setUndeployingAgentId(null);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (agentId: string, type: "single" | "multi") => {
    setDeletingAgentId(agentId);
    try {
      const endpoint =
        type === "single" ? `/single_agents/${agentId}` : `/multi_agents/${agentId}`;
      await api.delete(endpoint, { requireAuth: true, requireTenant: true });
      removeAgentFromState(agentId);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Delete failed.");
    } finally {
      setDeletingAgentId(null);
      setDeleteConfirmId(null);
    }
  };

  /* ================= FETCH ================= */
  const fetchNoCodeAgents = async () => {
    setLoading(true);
    try {
      const [singleData, multiData] = await Promise.all([
        api.get("/single_agents", { requireAuth: true, requireTenant: true }),
        api.get("/multi_agents", { requireAuth: true, requireTenant: true }),
      ]);

      const mappedSingle: SingleAgent[] = (
        Array.isArray(singleData) ? singleData : singleData.agents || []
      ).map((a: any) => ({ ...a, type: "single", agent_type: "single" }));

      const mappedMulti: MultiAgent[] = (
        Array.isArray(multiData) ? multiData : multiData.agents || []
      ).map((a: any) => ({ ...a, type: "multi", agent_type: "multi" }));

      setSingleAgents(mappedSingle);
      setMultiAgents(mappedMulti);
      setAgents([...mappedSingle, ...mappedMulti]);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async (type = "All") => {
    if (type === "All" || type === "No Code") await fetchNoCodeAgents();
    else setAgents([]);
  };

  /* ================= FILTER ================= */
  const handleSubFilterChange = (val: string) => {
    setSubFilter(val);
    if (val === "all") setAgents([...singleAgents, ...multiAgents]);
    else if (val === "single") setAgents(singleAgents);
    else if (val === "multi") setAgents(multiAgents);
  };

  useEffect(() => { fetchAgents(filter); }, [filter]);

  /* ================= RENDER ================= */
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap");
        :root {
          --bg: #080b0f;
          --surface: #0d1117;
          --surface-2: #161b22;
          --border: rgba(255, 255, 255, 0.06);
          --border-hover: rgba(59, 130, 246, 0.3);
          --accent: #3b82f6;
          --text-primary: #f0f6fc;
          --text-secondary: #7d8590;
        }
        .registry-root {
          font-family: "Syne", sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 2rem 2.5rem;
        }
        .grid-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .glow-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.05), transparent 50%);
        }
        .agent-card {
          background: var(--surface) !important;
          border: 1px solid var(--border) !important;
          border-radius: 12px !important;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .agent-card:hover {
          border-color: var(--border-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
        }
        .delete-btn {
          opacity: 0;
          transition: opacity 0.2s, color 0.2s;
        }
        .agent-card:hover .delete-btn {
          opacity: 1;
        }
        .delete-btn:hover {
          color: #f87171 !important;
        }
      `}</style>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
              Delete Agent?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-secondary)" }}>
              This action cannot be undone. The agent will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const agent = agents.find((a) => a.id === deleteConfirmId);
                if (agent) handleDelete(agent.id, agent.type);
              }}
              disabled={deletingAgentId === deleteConfirmId}
              style={{
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171",
              }}
            >
              {deletingAgentId === deleteConfirmId ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </span>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="registry-root">
        <div className="grid-overlay" />
        <div className="glow-bg" />

        {/* ── HEADER ── */}
        <div
          className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-8 mb-10 gap-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 44,
                height: 44,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                boxShadow: "0 0 16px rgba(59,130,246,0.15)",
              }}
            >
              <Bot className="h-5 w-5" style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Agent Registry
              </h1>
              <p className="text-sm mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>
                Manage, monitor and control your deployed AI agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Filter className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                  <span>Type: {filter}</span>
                  <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <DropdownMenuLabel style={{ color: "var(--accent)" }}>Category</DropdownMenuLabel>
                <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                <DropdownMenuItem
                  className="cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => { setFilter("All"); setSubFilter("all"); }}
                >
                  All Agents
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => { setFilter("No Code"); setSubFilter("all"); }}
                >
                  No Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => { setFilter("Low Code"); setSubFilter("all"); }}
                >
                  Low Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge
              className="px-3 py-1.5 text-sm font-semibold"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#3B82F6",
              }}
            >
              Total Agents: {agents.length}
            </Badge>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="relative z-10 flex items-center gap-2 mb-8" style={{ color: "var(--text-secondary)" }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--accent)" }} />
            <p className="text-sm">Fetching agents...</p>
          </div>
        )}

        {/* ── SUB FILTER ── */}
        {filter === "No Code" && (
          <div className="relative z-10 mb-8">
            <Tabs value={subFilter} onValueChange={handleSubFilterChange}>
              <TabsList
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "3px",
                }}
              >
                {[
                  { val: "all", label: "All" },
                  { val: "single", label: "Single Agent" },
                  { val: "multi", label: "Multi Agent" },
                ].map(({ val, label }) => (
                  <TabsTrigger
                    key={val}
                    value={val}
                    className="text-xs font-semibold rounded-md transition-all data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:shadow-none"
                    style={{ color: subFilter === val ? "#fff" : "var(--text-secondary)" }}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* ── GRID ── */}
        <div className="relative z-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="agent-card flex flex-col justify-between group">
              <CardHeader className="space-y-4 pb-3">

                {/* TYPE PILL + LIVE DOT + DELETE */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: "#3B82F6",
                    }}
                  >
                    {agent.type === "single" ? (
                      <><Zap className="h-3 w-3" />&nbsp;Single</>
                    ) : (
                      <><Layers className="h-3 w-3" />&nbsp;Multi</>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAgentDeployed(agent) && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#22c55e" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                        Live
                      </span>
                    )}
                    <button
                      className="delete-btn p-1 rounded-md"
                      style={{ color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer" }}
                      onClick={() => setDeleteConfirmId(agent.id)}
                      title="Delete agent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* AGENT NAME */}
                <CardTitle className="text-xl font-bold truncate mb-2" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {agent.name}
                </CardTitle>

                {/* TENANT */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Tenant</span>
                  <code
                    className="text-[10px] truncate max-w-[150px] px-2 py-0.5 rounded"
                    style={{ fontFamily: "'DM Mono', monospace", background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    {typeof window !== "undefined" ? localStorage.getItem("tenant_name") || agent.tenant_id : agent.tenant_id}
                  </code>
                </div>

                {/* DESCRIPTION */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Description</span>
                  <code
                    className="text-[10px] truncate max-w-[150px] px-2 py-0.5 rounded"
                    style={{ fontFamily: "'DM Mono', monospace", background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    {agent?.description || "N/A"}
                  </code>
                </div>

                {/* SINGLE AGENT DETAILS */}
                {agent.type === "single" && (
                  <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--text-secondary)" }}>Primary Tool</span>
                      <span
                        className="text-xs font-semibold px-1 py-1 rounded max-w-[70%] break-words text-center"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        {agent.tool?.tool_name || "N/A"}
                      </span>
                    </div>
                  </div>
                )}

                {/* MULTI AGENT DETAILS */}
                {agent.type === "multi" && (
                  <div className="pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusClasses(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tags && agent.tags.length > 0 ? (
                        agent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-[10px] font-medium rounded border transition-colors group-hover:text-[#3B82F6] group-hover:border-[rgba(59,130,246,0.3)]"
                            style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs italic" style={{ color: "var(--text-secondary)" }}>No tags</span>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>

              {/* ── FOOTER ── */}
              <CardFooter className="flex flex-col sm:flex-row gap-2 p-4 pt-2">

                {/* ===== SINGLE AGENT FOOTER ===== */}
                {agent.type === "single" && (
                  <>
                    {isAgentDeployed(agent) ? (
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1 text-sm font-semibold transition-all"
                        onClick={() => handleUndeploy(agent)}
                        disabled={undeployingAgentId === agent.id}
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}
                      >
                        {undeployingAgentId === agent.id ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Undeploying...</span>
                        ) : "Undeploy"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1 text-sm font-semibold transition-all"
                        onClick={() => handleDeploy(agent)}
                        disabled={deployingAgentId === agent.id}
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                      >
                        {deployingAgentId === agent.id ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Deploying...</span>
                        ) : "Deploy"}
                      </Button>
                    )}

                    {isAgentDeployed(agent) ? (
                      <Button
                        className="w-full sm:flex-1 text-sm font-semibold text-white"
                        onClick={() => router.push(`/single_agent/chat_ui/${agent.id}`)}
                        style={{ background: "#3B82F6", border: "none", boxShadow: "0 0 15px rgba(59,130,246,0.3)" }}
                      >
                        Open Chat
                      </Button>
                    ) : (
                      <Button
                        className="w-full sm:flex-1 text-sm font-semibold"
                        disabled
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", opacity: 0.5 }}
                      >
                        Open Chat
                      </Button>
                    )}
                  </>
                )}

                {/* ===== MULTI AGENT FOOTER ===== */}
                {agent.type === "multi" && (
                  <>
                    {isAgentDeployed(agent) ? (
                      // DEPLOYED → Undeploy + Run
                      <>
                        <Button
                          variant="outline"
                          className="w-full sm:flex-1 text-sm font-semibold transition-all"
                          onClick={() => handleMultiUndeploy(agent)}
                          disabled={undeployingAgentId === agent.id}
                          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}
                        >
                          {undeployingAgentId === agent.id ? (
                            <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Undeploying...</span>
                          ) : "Undeploy"}
                        </Button>

                        {/* Run → opens canvas in run mode (read-only + chat auto-open) */}
                        <Button
                          className="w-full sm:flex-1 text-sm font-semibold text-white"
                          onClick={() => router.push(`/agent-builder/${agent.id}?mode=run`)}
                          style={{ background: "#3B82F6", border: "none", boxShadow: "0 0 15px rgba(59,130,246,0.3)" }}
                        >
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Run
                          </span>
                        </Button>
                      </>
                    ) : (
                      // NOT DEPLOYED → View Config (read-only canvas, no chat)
                      <Button
                        className="w-full text-sm font-semibold text-white"
                        onClick={() => router.push(`/agent-builder/${agent.id}?mode=view`)}
                        style={{ background: "#3B82F6", border: "none", boxShadow: "0 0 15px rgba(59,130,246,0.3)" }}
                      >
                        View Config
                      </Button>
                    )}
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default AgentRegistry;
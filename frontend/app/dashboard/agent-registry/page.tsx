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
import { ChevronDown, Filter, Loader2 } from "lucide-react";

/* ================= TYPES ================= */
export type Tool = {
  tool_id: number;
  tool_name: string;
};

export type SingleAgent = {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  instruction?: string;
  tool: Tool | null;
};

export type MultiAgent = {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
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

  /* ================= STATUS BADGE (Dark Mode Optimized) ================= */

  const getStatusClasses = (status?: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400";
      case "inactive":
        return "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  /* ================= FETCH ================= */

  const fetchNoCodeAgents = async () => {
    setLoading(true);
    try {
      const [singleRes, multiRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/single_agents`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/multi_agents`),
      ]);

      const singleJson = await singleRes.json();
      const multiJson = await multiRes.json();

      const singleData: SingleAgent[] = Array.isArray(singleJson)
        ? singleJson
        : singleJson.agents || [];
      const multiData: MultiAgent[] = Array.isArray(multiJson)
        ? multiJson
        : multiJson.agents || [];

      setSingleAgents(singleData);
      setMultiAgents(multiData);
      setAgents([...singleData, ...multiData]);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async (type = "All") => {
    if (type === "All" || type === "No Code") {
      await fetchNoCodeAgents();
    } else {
      setAgents([]);
    }
  };

  /* ================= FILTER HANDLER ================= */

  const handleSubFilterChange = (val: string) => {
    setSubFilter(val);
    if (val === "all") setAgents([...singleAgents, ...multiAgents]);
    else if (val === "single") setAgents(singleAgents);
    else if (val === "multi") setAgents(multiAgents);
  };

  useEffect(() => {
    fetchAgents(filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 transition-colors duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Agent Registry
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage, monitor and control your deployed AI agents
          </p>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <Filter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <span>Type: {filter}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 dark:bg-zinc-900 dark:border-zinc-800">
              <DropdownMenuLabel className="dark:text-zinc-300">
                Category
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-zinc-800" />
              <DropdownMenuItem
                className="dark:focus:bg-zinc-800 cursor-pointer"
                onClick={() => {
                  setFilter("All");
                  setSubFilter("all");
                }}
              >
                All Agents
              </DropdownMenuItem>
              <DropdownMenuItem
                className="dark:focus:bg-zinc-800 cursor-pointer"
                onClick={() => {
                  setFilter("No Code");
                  setSubFilter("all");
                }}
              >
                No Code
              </DropdownMenuItem>
              <DropdownMenuItem
                className="dark:focus:bg-zinc-800 cursor-pointer"
                onClick={() => {
                  setFilter("Low Code");
                  setSubFilter("all");
                }}
              >
                Low Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge
            variant="secondary"
            className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Total Agents : {agents.length}
          </Badge>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Fetching agents from registry...</p>
        </div>
      )}

      {/* SUB TABS */}
      {filter === "No Code" && (
        <div className="mb-8">
          <Tabs
            defaultValue="all"
            value={subFilter}
            onValueChange={handleSubFilterChange}
          >
            <TabsList className="bg-zinc-200/50 dark:bg-zinc-900 border dark:border-zinc-800">
              <TabsTrigger
                value="all"
                className="dark:data-[state=active]:bg-zinc-800"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="single"
                className="dark:data-[state=active]:bg-zinc-800"
              >
                Single Agent
              </TabsTrigger>
              <TabsTrigger
                value="multi"
                className="dark:data-[state=active]:bg-zinc-800"
              >
                Multi Agent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* GRID */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 rounded-xl flex flex-col justify-between"
          >
            <CardHeader className="space-y-4">
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {agent.name}
              </CardTitle>

              {/* SHARED DATA (Tenant ID) */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                  Tenant ID
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] dark:border-zinc-700 dark:text-zinc-400"
                >
                  {agent.tenant_id}
                </Badge>
              </div>

              {/* SINGLE AGENT SPECIFIC */}
              {"tool" in agent && (
                <div className="space-y-3 pt-2 border-t dark:border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      Description
                    </span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-400 line-clamp-2">
                      {agent.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      Primary Tool
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none"
                    >
                      {agent.tool?.tool_name || "N/A"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* MULTI AGENT SPECIFIC */}
              {"status" in agent && (
                <div className="space-y-3 pt-2 border-t dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      Status
                    </span>
                    <Badge
                      variant="outline"
                      className={`${getStatusClasses(agent.status)} capitalize border px-2 py-0`}
                    >
                      {agent.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                      Network Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tags && agent.tags.length > 0 ? (
                        agent.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500 italic">
                          No tags
                        </span>
                      )}
                    </div>
                  </div>

                  {/* <div>
                    <h1>ggugugugu</h1>
                  </div> */}
                </div>
              )}
            </CardHeader>

            <CardFooter className="flex gap-2 p-4 pt-0">
              {/* COMMON BUTTON: Deploy (Available for both Single and Multi) */}
              <Button
                variant="outline"
                className="flex-1 font-semibold dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => router.push(`/deploy/${agent.id}`)}
              >
                Deploy
              </Button>

              {/* CONDITIONAL BUTTONS */}
              {"tool" in agent ? (
                /* SINGLE AGENT: Chat Button */
                <Button
                  className="flex-1 font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
                  onClick={() =>
                    router.push(
                      `/single_agent/chat_ui/${agent.id}?tool_id=${agent.tool?.tool_id}`,
                    )
                  }
                  disabled={!agent.tool} // Disable if tool is null
                >
                  Open Chat
                </Button>
              ) : (
                /* MULTI AGENT: View Configuration Button */
                <Button
                  className="flex-1 font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white"
                  onClick={() => router.push(`/agent-builder/${agent.id}`)}
                >
                  View Config
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentRegistry;

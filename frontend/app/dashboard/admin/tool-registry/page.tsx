"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Wrench,
  Globe,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client"; // Using your api-client logic

interface Tool {
  tool_id: number; // Backend names usually match your SingleAgentPage logic
  tool_name: string;
  tool_api: string;
}

export default function ToolRegistryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    api_url: "",
  });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const data = await api.get("/tools", { requireAuth: true });
      setTools(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.api_url) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingTool) {
        // UPDATE Logic
        await api.put(
          `/tools/${editingTool.tool_id}`,
          {
            tool_name: form.name,
            tool_api: form.api_url,
          },
          { requireAuth: true },
        );
        toast.success("Tool updated successfully");
      } else {
        // CREATE Logic
        await api.post(
          "/tools",
          {
            tool_name: form.name,
            tool_api: form.api_url,
          },
          { requireAuth: true },
        );
        toast.success("Tool registered successfully");
      }

      setOpen(false);
      setEditingTool(null);
      setForm({ name: "", api_url: "" });
      fetchTools();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    try {
      await api.delete(`/tools/${id}`, { requireAuth: true });
      toast.success("Tool removed");
      fetchTools();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const openEdit = (tool: Tool) => {
    setEditingTool(tool);
    setForm({ name: tool.tool_name, api_url: tool.tool_api });
    setOpen(true);
  };

  const filteredTools = tools.filter((t) =>
    t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080B0F]">
        <Loader2 className="animate-spin text-[#3B82F6] w-10 h-10" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap");
        :root {
          --bg: #080b0f;
          --surface: #0d1117;
          --surface-2: #161b22;
          --border: rgba(255, 255, 255, 0.06);
          --accent: #3b82f6;
          --text-secondary: #7d8590;
        }
        body {
          font-family: "Syne", sans-serif;
          background: var(--bg);
          color: white;
        }
        .mono {
          font-family: "DM Mono", monospace;
        }
      `}</style>

      <div className="relative min-h-screen p-6 md:p-12 overflow-hidden">
        {/* Background Glows (Matching your UI) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border)] pb-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                Tool Registry
              </h1>
              <p className="text-[var(--text-secondary)]">
                Centralized management for your tools.
              </p>
            </div>

            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) setEditingTool(null);
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Plus className="w-5 h-5 mr-2" /> Register New Tool
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-[var(--surface)] border-[var(--border)] backdrop-blur-2xl rounded-3xl p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    {editingTool ? "Update Tool" : "Register Tool"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                      Tool Name
                    </Label>
                    <Input
                      className="bg-[var(--surface-2)] border-[var(--border)] h-12 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., Google Search API"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                      Endpoint URL
                    </Label>
                    <Input
                      className="bg-[var(--surface-2)] border-[var(--border)] h-12 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="https://api.example.com/v1"
                      value={form.api_url}
                      onChange={(e) =>
                        setForm({ ...form, api_url: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={handleSubmit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : null}
                    {editingTool ? "Save Changes" : "Confirm Registration"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Filter tools..."
              className="pl-12 bg-[var(--surface)] border-[var(--border)] h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <Card
                key={tool.tool_id}
                className="bg-[var(--surface)] border-[var(--border)] hover:border-blue-500/40 transition-all duration-300 group rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-500/30 text-blue-400 mono text-[10px]"
                    >
                      ACTIVE
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <CardTitle className="text-xl font-bold mb-1">
                      {tool.tool_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Globe className="w-3 h-3" />
                      <span className="text-xs mono truncate">
                        {tool.tool_api}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[var(--border)] hover:bg-[var(--surface-2)] h-10"
                      onClick={() => openEdit(tool)}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 px-4 text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all rounded-lg"
                      onClick={() => {
                        if (confirm("Delete this tool?")) {
                          handleDelete(tool.tool_id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Delete
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-3xl">
              <p className="text-[var(--text-secondary)]">
                No tools found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

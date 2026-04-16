"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import { Bot, Wrench, Loader2, Globe, Key } from "lucide-react";

import { tenant } from "@/lib/tenant";
import { api } from "@/lib/api-client";

export default function SingleAgentPage() {
  const router = useRouter();

  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("");

  const [form, setForm] = useState({
    tenant_id: "",
    name: "",
    description: "",
    tool_id: "",
    instruction: "",
    agent_type: "single",
    visibility: "private",
    is_api_enabled: false,
  });

  const dummyInstructions = [
    "Summarize the given text",
    "Translate input into Hindi",
    "Extract important keywords",
    "Generate short explanation",
    "Convert text into bullet points",
  ];

  useEffect(() => {
    const tenantId = tenant.getCurrentTenantId();
    if (tenantId) {
      setForm((prev) => ({
        ...prev,
        tenant_id: tenantId,
      }));
    }
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const data = await api.get("/tools", { requireAuth: false });
        setTools(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load tools");
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  useEffect(() => {
    const savedForm = localStorage.getItem("agentForm");
    if (!savedForm) return;

    const parsed = JSON.parse(savedForm);
    setForm(parsed);

    if (parsed.instruction) {
      if (dummyInstructions.includes(parsed.instruction)) {
        setMode("select");
      } else {
        setMode("create");
      }
    }
  }, []);

  const handlePreview = () => {
    localStorage.setItem("agentForm", JSON.stringify(form));
    router.push("/single-agent-preview");
  };

  const handleSubmit = async () => {
    if (!form.tenant_id || !form.name || !form.tool_id || !form.instruction) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/single_agents",
        {
          name: form.name,
          description: form.description,
          instruction: form.instruction,
          tool_id: Number(form.tool_id),
          agent_type: "single",
          visibility: form.visibility,
          is_api_enabled: form.is_api_enabled,
        },
        {
          requireAuth: true,
          requireTenant: true,
        }
      );

      toast.success("Agent created successfully");
      localStorage.removeItem("agentForm");
      router.push("/dashboard/agent-registry");
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* GLOBAL THEME */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;

          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);

          --accent: #3B82F6;
          --accent-glow: rgba(59,130,246,0.15);

          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
          --text-tertiary: #444C56;
        }

        body {
          font-family: 'Syne', sans-serif;
          background: var(--bg);
        }

        .mono {
          font-family: 'DM Mono', monospace;
        }
      `}</style>

      <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text-primary)] selection:bg-blue-500/30">

        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.013)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.013)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">

          {/* Card */}
          <div className="w-full max-w-[520px] bg-[var(--surface)] border border-[var(--border)] backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-8">

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)] mb-2">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight">
                Create AI Agent
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Deploy a specialized agent with custom logic and tools.
              </p>
            </div>

            {/* FORM */}
            <div className="space-y-5">

              <div className="space-y-2">
                <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                  Agent Name
                </Label>
                <Input
                  className="bg-[var(--surface-2)] border border-[var(--border)] focus:border-blue-500 focus:ring-2 focus:ring-[var(--accent-glow)]"
                  placeholder="Sales Assistant"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                  Description
                </Label>
                <Textarea
                  className="bg-[var(--surface-2)] border border-[var(--border)] focus:border-blue-500 focus:ring-2 focus:ring-[var(--accent-glow)]"
                  placeholder="What does this agent do?"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* Instruction */}
              <div className="p-4 rounded-2xl border border-[var(--border)] space-y-4">
                <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                  Instruction
                </Label>

                <Select
                  value={mode}
                  onValueChange={(val) => {
                    setMode(val);
                    setForm({ ...form, instruction: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How to instruct ?" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="create">
                      Write Custom Instructions
                    </SelectItem>
                    <SelectItem value="select">
                      Use predefined Instructions
                    </SelectItem>
                  </SelectContent>
                </Select>

                {mode === "create" && (
                  <Textarea
                    className="bg-[var(--surface-2)] border border-[var(--border)] focus:border-blue-500 focus:ring-2 focus:ring-[var(--accent-glow)]"
                    placeholder="Use professional and system level instructions"
                    value={form.instruction}
                    onChange={(e) =>
                      setForm({ ...form, instruction: e.target.value })
                    }
                  />
                )}

                {mode === "select" && (
                  <Select
                    value={form.instruction}
                    onValueChange={(val) =>
                      setForm({ ...form, instruction: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Instruction" />
                    </SelectTrigger>

                    <SelectContent>
                      {dummyInstructions.map((inst, i) => (
                        <SelectItem key={i} value={inst}>
                          {inst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Tool */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[var(--text-secondary)]" />
                  <Label className="text-xs uppercase mono text-[var(--text-secondary)]">
                    Select Tool
                  </Label>
                </div>

                <Select
                  value={form.tool_id}
                  onValueChange={(val) =>
                    setForm({ ...form, tool_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Attach a tool..." />
                  </SelectTrigger>

                  <SelectContent>
                    {tools.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        No tools available
                      </SelectItem>
                    ) : (
                      tools.map((tool) => (
                        <SelectItem
                          key={tool.tool_id}
                          value={tool.tool_id.toString()}
                        >
                          {tool.tool_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Agent-as-API Settings */}
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <Label className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  API Access Settings
                </Label>
              </div>

              {/* Make Public Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Make Public</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Allow other tenants to discover this agent
                  </p>
                </div>
                <Switch
                  checked={form.visibility === "public"}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, visibility: checked ? "public" : "private" })
                  }
                />
              </div>

              {/* Enable API Access Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable API Access</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Allow execution via API key
                  </p>
                </div>
                <Switch
                  checked={form.is_api_enabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_api_enabled: checked })
                  }
                />
              </div>

              {form.is_api_enabled && form.visibility === "public" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800">
                  <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Agent-as-API Enabled:</strong> Other tenants can execute this agent using API keys.
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="w-1/2 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                onClick={handlePreview}
              >
                Preview
              </Button>

              <Button
                className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating
                  </span>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
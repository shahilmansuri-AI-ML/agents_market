"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bot, Wrench, Loader2 } from "lucide-react";

export default function SingleAgentPage() {
  const router = useRouter();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("");

  const dummyInstructions = [
    "Summarize the given text",
    "Translate input into Hindi",
    "Extract important keywords",
    "Generate short explanation",
    "Convert text into bullet points",
  ];

  const [form, setForm] = useState({
    tenant_id: "",
    name: "",
    description: "",
    tool_id: "",
    instruction: "",
  });

  /* ---------------- FETCH TOOLS ---------------- */
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/`);

        if (!res.ok) {
          throw new Error("Failed to fetch tools");
        }

        const data = await res.json();

        setTools(data);

        // // 🔥 OPTIONAL: auto select first tool
        // if (data.length > 0) {
        //   setForm((prev) => ({
        //     ...prev,
        //     tool_id: data[0].tool_id.toString()
        //   }));
        // }
      } catch (err) {
        toast.error("Failed to load tools");
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleSubmit = async () => {
    if (!form.tenant_id || !form.name || !form.tool_id || !form.instruction) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/single_agents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tool_id: Number(form.tool_id),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.detail);
        return;
      }
      const data = await res.json();
      toast.success("Agent created successfully");
      router.push(
        `/single_agent/chat_ui/${data.agent.id}?tool_id=${form.tool_id}`,
      );
    } catch (err) {
      toast.error("Backend error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Changed bg-[#030303] to theme-aware bg-zinc-50 and dark:bg-[#030303]
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-[#030303] text-zinc-900 dark:text-zinc-200 transition-colors duration-300 selection:bg-indigo-500/30">
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px]" />

        {/* Pattern: Visible in both, but softer in light mode */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        {/* --- FORM CARD: Adaptive background and border --- */}
        <div className="w-full max-w-[520px] bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-2">
              <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Create AI Agent
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Deploy a specialized agent with custom logic and tools.
            </p>
          </div>

          <div className="space-y-5">
            {/* Tenant & Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                  Tenant ID
                </Label>
                <Input
                  className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/50"
                  placeholder="ID-001"
                  value={form.tenant_id}
                  onChange={(e) =>
                    setForm({ ...form, tenant_id: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                  Agent Name
                </Label>
                <Input
                  className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/50"
                  placeholder="Sales Assistant"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">
                Description
              </Label>
              <Textarea
                className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/50 min-h-[80px] resize-none"
                placeholder="What does this agent do?"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* Instructions Section */}
            <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Label className="text-[12px] tracking-[0.05em] font-bold text-zinc-500 dark:text-zinc-500 uppercase">
                  Instruction
                </Label>
              </div>

              <Select
                value={mode}
                onValueChange={(val) => {
                  setMode(val);
                  setForm({ ...form, instruction: "" });
                }}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
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
                  placeholder="Use professional and system level instructions"
                  value={form.instruction}
                  onChange={(e) =>
                    setForm({ ...form, instruction: e.target.value })
                  }
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-indigo-500/50"
                />
              )}

              {mode === "select" && (
                <Select
                  value={form.instruction}
                  onValueChange={(val) =>
                    setForm({ ...form, instruction: val })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
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

            {/* Tool Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-1">
                <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Select Tool
                </Label>
              </div>
              <Select
                value={form.tool_id}
                onValueChange={(val) => setForm({ ...form, tool_id: val })}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 py-6">
                  <SelectValue placeholder="Attach a tool to agent..." />
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

          {/* Submit Button */}
          <Button
            className="w-full bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white py-7 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg dark:shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Creating
              </span>
            ) : (
              <span>Create & Launch Agent</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

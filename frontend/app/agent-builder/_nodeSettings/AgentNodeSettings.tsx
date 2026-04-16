"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import {
  Save,
  Loader2,
  User,
  Cpu,
  Wrench,
  FileText,
  Zap,
  Shield,
  ChevronDown,
  Info,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  TYPES                                                               */
/* ------------------------------------------------------------------ */

interface AgentSettingsProps {
  selectedNode: {
    id: string;
    data?: { config?: Record<string, string> };
  } | null;
  updateFormData: (data: Record<string, string>) => void;
}

interface FreeModel {
  label: string;
  model_id: string;
  provider: string;
}

interface Tool {
  tool_id: number;
  tool_name: string;
}

interface FormData {
  name: string;
  instruction: string;
  model_id: string | undefined;   // canonical model id, e.g. "gemini-2.0-flash"
  model_label: string | undefined; // display label
  provider: string | undefined;
  api_link: string;
  tool: string | undefined;
}

const defaultForm: FormData = {
  name: "",
  instruction: "",
  model_id: undefined,
  model_label: undefined,
  provider: undefined,
  api_link: "",
  tool: undefined,
};

/* ------------------------------------------------------------------ */
/*  PROVIDER → badge colour                                             */
/* ------------------------------------------------------------------ */
const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gemini:    { bg: "rgba(66,133,244,0.15)",  text: "#60A5FA", border: "rgba(66,133,244,0.35)" },
  groq:      { bg: "rgba(234,179,8,0.15)",   text: "#FCD34D", border: "rgba(234,179,8,0.35)" },
  openai:    { bg: "rgba(16,163,127,0.15)",  text: "#34D399", border: "rgba(16,163,127,0.35)" },
  anthropic: { bg: "rgba(251,146,60,0.15)",  text: "#FB923C", border: "rgba(251,146,60,0.35)" },
  deepseek:  { bg: "rgba(168,85,247,0.15)",  text: "#C084FC", border: "rgba(168,85,247,0.35)" },
};

function ProviderBadge({ provider }: { provider: string }) {
  const c = PROVIDER_COLORS[provider] ?? {
    bg: "rgba(148,163,184,0.15)", text: "#94A3B8", border: "rgba(148,163,184,0.3)",
  };
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {provider}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  FALLBACK CHAIN BADGE                                                */
/* ------------------------------------------------------------------ */
function FallbackChainInfo() {
  return (
    <div
      className="rounded-xl p-3 text-[10px] space-y-1.5"
      style={{
        background: "rgba(59,130,246,0.06)",
        border: "1px solid rgba(59,130,246,0.18)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Shield size={11} style={{ color: "#60A5FA" }} />
        <span className="font-bold uppercase tracking-widest" style={{ color: "#60A5FA" }}>
          Auto-Fallback Active
        </span>
      </div>

      {/* Layer 1 */}
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0"
          style={{ background: "rgba(34,197,94,0.2)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.3)" }}
        >1</span>
        <span style={{ color: "#94A3B8" }}>
          <span style={{ color: "#E2E8F0" }}>Selected model</span> — your primary choice
        </span>
      </div>

      {/* Arrow */}
      <div className="ml-2 text-[9px]" style={{ color: "#475569" }}>↓ on limit / failure</div>

      {/* Layer 2 */}
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0"
          style={{ background: "rgba(234,179,8,0.2)", color: "#FCD34D", border: "1px solid rgba(234,179,8,0.3)" }}
        >2</span>
        <span style={{ color: "#94A3B8" }}>
          <span style={{ color: "#E2E8F0" }}>Groq</span>{" "}
          <span className="font-mono" style={{ color: "#FCD34D" }}>llama-3.1-8b-instant</span>
          <span className="ml-1 text-[8px]" style={{ color: "#64748B" }}>(always-on)</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FIELD LABEL                                                         */
/* ------------------------------------------------------------------ */
function FieldLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <Label className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      <Icon size={12} />
      {label}
    </Label>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */
export default function AgentSettings({ selectedNode, updateFormData }: AgentSettingsProps) {
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [freeModels, setFreeModels] = useState<FreeModel[]>([]);
  const [toolOptions, setToolOptions] = useState<{ label: string; value: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  /* ── Fetch free models + tools ─────────────────────────── */
  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [freeModelsRes, tools] = await Promise.all([
          api.get("/llm-models/free-models", { requireAuth: false }),
          api.get("/tools", { requireAuth: false }),
        ]);

        setFreeModels(freeModelsRes?.models ?? []);
        setToolOptions(
          (tools ?? []).map((t: Tool) => ({
            label: t.tool_name,
            value: String(t.tool_id),
          }))
        );
      } catch {
        toast.error("Failed to load options");
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  /* ── Load node config from localStorage / node data ───── */
  useEffect(() => {
    if (!selectedNode) return;
    try {
      const local = localStorage.getItem(`node-config-${selectedNode.id}`);
      const raw = local ? JSON.parse(local) : selectedNode.data?.config;
      setFormData(raw ? { ...defaultForm, ...raw } : defaultForm);
    } catch {
      setFormData(defaultForm);
    }
  }, [selectedNode]);

  /* ── Save ───────────────────────────────────────────────── */
  const onSave = () => {
    if (!selectedNode) return;
    if (!formData.name || !formData.instruction || !formData.model_id) {
      return toast.error("Please fill all required fields (Name, Instructions, Model)");
    }

    setLoading(true);
    try {
      const dataToSave = { ...formData } as any;
      // Persist canonical model id as `llm` for downstream compatibility
      dataToSave.llm = formData.model_id;
      updateFormData(dataToSave);
      localStorage.setItem(`node-config-${selectedNode.id}`, JSON.stringify(dataToSave));
      toast.success("Agent configured successfully 🚀");
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const selectedModel = freeModels.find((m) => m.model_id === formData.model_id);

  return (
    <div className="flex flex-col gap-4 p-1 font-syne">

      {/* Name */}
      <div className="space-y-1">
        <FieldLabel icon={User} label="Name" />
        <Input
          placeholder="Agent name..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-white/5 border-white/10 rounded-[10px] focus-visible:ring-blue-500/40"
        />
      </div>

      {/* Instructions */}
      <div className="space-y-1">
        <FieldLabel icon={FileText} label="Instructions" />
        <Textarea
          placeholder="Describe what this agent should do..."
          value={formData.instruction}
          onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
          rows={4}
          className="bg-white/5 border-white/10 rounded-[10px] focus-visible:ring-blue-500/40 overflow-y-auto"
          style={{ resize: "vertical", minHeight: "50px", maxHeight: "320px" }}
        />
      </div>

      {/* Model Selection */}
      <div className="space-y-1">
        <FieldLabel icon={Cpu} label="Model" />

        <Select
          disabled={optionsLoading}
          value={formData.model_id}
          onValueChange={(val) => {
            const m = freeModels.find((x) => x.model_id === val);
            setFormData({
              ...formData,
              model_id: val,
              model_label: m?.label ?? val,
              provider: m?.provider ?? "",
            });
          }}
        >
          <SelectTrigger className="bg-white/5 border-white/10 rounded-[10px]">
            {formData.model_id ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate text-sm">{formData.model_label ?? formData.model_id}</span>
                {selectedModel && <ProviderBadge provider={selectedModel.provider} />}
              </div>
            ) : (
              <SelectValue placeholder={optionsLoading ? "Loading models…" : "Select a model"} />
            )}
          </SelectTrigger>

          <SelectContent className="bg-[#0d1117] border-white/10 text-white">
            {freeModels.map((m) => (
              <SelectItem key={m.model_id} value={m.model_id}>
                <div className="flex items-center gap-2 w-full">
                  <span className="flex-1">{m.label}</span>
                  <ProviderBadge provider={m.provider} />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Show selected model id as subtle hint */}
        {formData.model_id && (
          <p className="text-[9px] font-mono px-1" style={{ color: "#475569" }}>
            {formData.model_id}
          </p>
        )}
      </div>

      {/* Fallback Chain Info */}
      <FallbackChainInfo />

      {/* Tool */}
      <div className="space-y-1">
        <FieldLabel icon={Wrench} label="Tool (optional)" />
        <Select
          disabled={optionsLoading}
          onValueChange={(val) => setFormData({ ...formData, tool: val })}
          value={formData.tool}
        >
          <SelectTrigger className="bg-white/5 border-white/10 rounded-[10px]">
            <SelectValue placeholder="Select tool" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-white/10 text-white">
            {toolOptions.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[1px] bg-white/5 my-1" />

      {/* Save */}
      <Button
        onClick={onSave}
        disabled={loading || optionsLoading}
        className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-[10px] font-bold tracking-wide"
      >
        {loading ? (
          <Loader2 className="mr-2 animate-spin" size={14} />
        ) : (
          <Save className="mr-2" size={14} />
        )}
        {loading ? "Saving…" : "Save Configuration"}
      </Button>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Wrench, Globe, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

// Backend table ke hisaab se interface update kiya
interface LLMModel {
  id: string; // UUID string
  provider_name: string;
  model_name: string;
  model_api: string;
  created_at?: string;
}

export default function ToolRegistryPage() {
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    provider_name: "",
    model_name: "",
    model_api: "",
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Backend prefix /llm-models hai
      const data = await api.get("/llm-models", { requireAuth: false });
      setLlmModels(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load LLM models");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.provider_name || !form.model_name || !form.model_api) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingModel) {
        // UPDATE Logic
        await api.put(
          `/llm-models/${editingModel.id}`,
          form,
          { requireAuth: false }
        );
        toast.success("LLM updated successfully");
      } else {
        // CREATE Logic
        await api.post(
          "/llm-models",
          form,
          { requireAuth: false }
        );
        toast.success("LLM registered successfully");
      }

      setOpen(false);
      resetForm();
      fetchModels();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/llm-models/${id}`, { requireAuth: false });
      toast.success("LLM removed");
      fetchModels();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const resetForm = () => {
    setEditingModel(null);
    setForm({ provider_name: "", model_name: "", model_api: "" });
  };

  const openEdit = (model: LLMModel) => {
    setEditingModel(model);
    setForm({
      provider_name: model.provider_name,
      model_name: model.model_name,
      model_api: model.model_api,
    });
    setOpen(true);
  };

  const filteredModels = llmModels.filter((m) =>
    m.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.model_name.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* ... (Styles unchanged) ... */}
      <div className="relative min-h-screen p-6 md:p-12 overflow-hidden bg-[#080B0F]">
        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">LLM Registry</h1>
              <p className="text-gray-400">Manage your language models and API endpoints.</p>
            </div>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5 mr-2" /> Register LLM
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0d1117] border-white/10 text-white">
                <DialogHeader><DialogTitle>{editingModel ? "Update LLM" : "Register LLM"}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-xs">Provider Name</Label>
                    <Input className="bg-[#161b22] border-white/10" placeholder="OpenAI" value={form.provider_name} onChange={(e) => setForm({...form, provider_name: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Model Name</Label>
                    <Input className="bg-[#161b22] border-white/10" placeholder="gpt-4" value={form.model_name} onChange={(e) => setForm({...form, model_name: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">Endpoint URL</Label>
                    <Input className="bg-[#161b22] border-white/10" placeholder="https://api..." value={form.model_api} onChange={(e) => setForm({...form, model_api: e.target.value})} />
                  </div>
                  <Button className="w-full bg-blue-600" onClick={handleSubmit} disabled={submitLoading}>
                    {submitLoading && <Loader2 className="animate-spin mr-2" />}
                    {editingModel ? "Save Changes" : "Confirm Registration"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* SEARCH */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input 
                placeholder="Search models..." 
                className="pl-12 bg-[#0d1117] border-white/10" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="bg-[#0d1117] border-white/10 hover:border-blue-500/40 transition-all group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                      {model.model_name.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-white">{model.provider_name}</CardTitle>
                    <div className="flex items-center gap-2 text-gray-400 mt-2">
                      <Globe className="w-3 h-3" />
                      <span className="text-xs truncate max-w-[200px] font-mono">{model.model_api}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5 text-white" onClick={() => openEdit(model)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                      onClick={() => { if(confirm("Delete this model?")) handleDelete(model.id) }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl text-gray-500">
              No models found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
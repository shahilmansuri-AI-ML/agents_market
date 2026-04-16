"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Key, Plus, Loader2, Copy, Trash2, AlertTriangle, Bot, Terminal, Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  status: string;
  created_at: string;
  last_used_at?: string;
  allowed_agent_ids?: string[];
}

interface Agent {
  id: string;
  name: string;
  visibility: string;
  is_api_enabled: boolean;
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    allowed_agent_ids: [] as string[],
  });

  useEffect(() => {
    loadAPIKeys();
    loadAgents();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const data = await api.get("/api-keys", { requireTenant: true });
      setApiKeys(data);
    } catch (error: any) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      // Load public API-enabled agents from all tenants
      const singleAgents = await api.get("/single_agents/public/api-enabled", { requireAuth: true });
      const multiAgents = await api.get("/multi_agents/public/api-enabled", { requireAuth: true });
      
      const allAgents = [
        ...singleAgents.map((a: any) => ({ ...a, type: 'single' })),
        ...multiAgents.map((a: any) => ({ ...a, type: 'multi' }))
      ];
      
      setAgents(allAgents);
    } catch (error: any) {
      console.error("Failed to load agents:", error);
    }
  };

  const createAPIKey = async () => {
    if (!formData.name) {
      toast.error("Please enter a key name");
      return;
    }
    
    try {
      const response = await api.post("/api-keys", formData, { requireTenant: true });
      setNewKeyData({ key: response.api_key, name: formData.name });
      setFormData({ name: "", allowed_agent_ids: [] });
      loadAPIKeys();
    } catch (error: any) {
      toast.error("Failed to create API key");
    }
  };

  const toggleAgent = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_agent_ids: prev.allowed_agent_ids.includes(agentId)
        ? prev.allowed_agent_ids.filter(id => id !== agentId)
        : [...prev.allowed_agent_ids, agentId]
    }));
  };

  const revokeAPIKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/api-keys/${keyId}`, { requireTenant: true });
      toast.success("API key revoked");
      loadAPIKeys();
    } catch (error: any) {
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setNewKeyData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080B0F]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        
        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;
          --border: rgba(255,255,255,0.06);
          --accent: #3B82F6;
          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
        }

        body { 
          font-family: 'Syne', sans-serif; 
          background: var(--bg); 
          color: var(--text-primary); 
        }

        .dashboard-root { 
          position: relative; 
          min-height: 100vh; 
          padding: 2rem; 
        }

        .grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }

        .glow-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05), transparent 70%);
        }

        code, .font-mono { font-family: 'DM Mono', monospace; }

        .api-row:hover {
          background-color: rgba(255, 255, 255, 0.01) !important;
        }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />
        <div className="glow-bg" />

        <div className="relative z-10 space-y-8">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <Terminal className="w-8 h-8 text-[#3B82F6]" />
                API Infrastructure
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                Manage secure authentication tokens for external services
              </p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.15)] px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Secret Management</DialogTitle>
                  <DialogDescription className="text-[var(--text-secondary)]">
                    Create a unique key to access the API.
                  </DialogDescription>
                </DialogHeader>
                
                {newKeyData ? (
                  <div className="space-y-6 py-4">
                    <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs font-bold uppercase tracking-wider">
                        Security Warning: Copy this key now. It will never be shown again.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Secret API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={newKeyData.key} 
                          readOnly 
                          className="bg-black/40 border-[var(--border)] font-mono text-sm text-[#3B82F6]" 
                        />
                        <Button 
                          variant="outline"
                          className="border-[var(--border)] hover:bg-[var(--surface-2)]"
                          onClick={() => copyToClipboard(newKeyData.key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={closeDialog} className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">Confirm & Close</Button>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Key Identifier</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-[var(--surface-2)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6]"
                        placeholder="Production API Key"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Allowed Agents (Optional)
                      </Label>
                      <p className="text-xs text-zinc-500">
                        Select which agents this API key can execute. Leave empty for no access.
                      </p>
                      
                      {agents.length === 0 ? (
                        <div className="text-sm text-zinc-500 p-4 border rounded-lg text-center">
                          No public agents with API access available
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                          {agents.map((agent) => (
                            <div key={agent.id} className="flex items-center space-x-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded">
                              <Checkbox
                                id={agent.id}
                                checked={formData.allowed_agent_ids.includes(agent.id)}
                                onCheckedChange={() => toggleAgent(agent.id)}
                              />
                              <label
                                htmlFor={agent.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {agent.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.allowed_agent_ids.length > 0 && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">
                          {formData.allowed_agent_ids.length} agent(s) selected
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={createAPIKey} className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">Generate Key</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* TABLE SECTION */}
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]/40" />
            <CardHeader className="border-b border-[var(--border)] bg-white/[0.01]">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-[#3B82F6]" />
                Active Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-[var(--border)] hover:bg-transparent">
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Identifier</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Public Prefix</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Last Activity</TableHead>
                    <TableHead className="text-right text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4 px-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-[var(--text-secondary)] italic">
                        No API keys generated yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((key) => (
                      <TableRow key={key.id} className="border-[var(--border)] api-row">
                        <TableCell className="font-semibold text-[var(--text-primary)]">
                          {key.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-[11px] bg-[var(--surface-2)] text-[#3B82F6] px-2 py-1 rounded border border-[var(--border)]">
                            {key.prefix}••••••••
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            key.status === "active" 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }>
                            {key.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-xs">
                          <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-[#3B82F6]/50" />
                            {key.last_used_at
                              ? new Date(key.last_used_at).toLocaleDateString()
                              : "Never"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-[10px] uppercase tracking-wider"
                            onClick={() => revokeAPIKey(key.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Revoke Key
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Bot, Plus, Loader2, Trash2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description?: string;
  instruction: string;
  tool_id: number;
  created_at: string;
}

interface Tool {
  tool_id: number;
  tool_name: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instruction: "",
    tool_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agentsData, toolsData] = await Promise.all([
        api.get("/single_agents", { requireTenant: true }),
        api.get("/tools")
      ]);
      setAgents(agentsData);
      setTools(toolsData);
    } catch (error: any) {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    try {
      await api.post("/single_agents", {
        name: formData.name,
        description: formData.description,
        instruction: formData.instruction,
        tool_id: parseInt(formData.tool_id)
      }, { requireTenant: true });
      toast.success("Agent created successfully");
      setDialogOpen(false);
      setFormData({ name: "", description: "", instruction: "", tool_id: "" });
      loadData();
    } catch (error: any) {
      toast.error("Failed to create agent");
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    
    try {
      await api.delete(`/single_agents/${agentId}`, { requireTenant: true });
      toast.success("Agent deleted");
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete agent");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Create and manage your AI agents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>Configure your AI agent with instructions and tools</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer Support Agent"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Handles customer inquiries"
                />
              </div>
              <div>
                <Label htmlFor="instruction">Instructions</Label>
                <Textarea
                  id="instruction"
                  value={formData.instruction}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="You are a helpful customer support agent..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="tool">Tool</Label>
                <Select
                  value={formData.tool_id}
                  onValueChange={(value) => setFormData({ ...formData, tool_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((tool) => (
                      <SelectItem key={tool.tool_id} value={tool.tool_id.toString()}>
                        {tool.tool_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createAgent} className="w-full">Create Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    {agent.description && (
                      <CardDescription>{agent.description}</CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
                {agent.instruction}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Configure
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Create your first AI agent to get started
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

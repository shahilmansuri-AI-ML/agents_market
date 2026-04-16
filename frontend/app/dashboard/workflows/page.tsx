"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Workflow, Loader2, Plus } from "lucide-react";

interface MultiAgent {
  id: string;
  name: string;
  status: string;
  tags: string[];
  created_at: string;
}

export default function WorkflowsPage() {
  const [multiAgents, setMultiAgents] = useState<MultiAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMultiAgents();
  }, []);

  const loadMultiAgents = async () => {
    try {
      const data = await api.get("/multi_agents", { requireTenant: true });
      setMultiAgents(data);
    } catch (error: any) {
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Design multi-agent workflows</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {multiAgents.map((agent) => (
          <Card key={agent.id} className="cursor-pointer hover:border-indigo-500 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription>{agent.status}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {multiAgents.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="w-12 h-12 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Create your first multi-agent workflow
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

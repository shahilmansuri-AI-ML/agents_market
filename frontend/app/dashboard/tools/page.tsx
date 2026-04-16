"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Wrench, Loader2, Play } from "lucide-react";

interface Tool {
  tool_id: number;
  tool_name: string;
  tool_api: string;
  created_at?: string;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const data = await api.get("/tools");
      setTools(data);
    } catch (error: any) {
      toast.error("Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  const executeTool = async (toolId: number, toolName: string) => {
    try {
      await api.post("/tools/execute", {
        tool_id: toolId,
        message: "Test execution"
      });
      toast.success(`Executed ${toolName}`);
    } catch (error: any) {
      toast.error("Failed to execute tool");
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Tools
          </CardTitle>
          <CardDescription>Available tools for your AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tool Name</TableHead>
                <TableHead>API Endpoint</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.tool_id}>
                  <TableCell className="font-mono">{tool.tool_id}</TableCell>
                  <TableCell className="font-medium">{tool.tool_name}</TableCell>
                  <TableCell className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    {tool.tool_api}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeTool(tool.tool_id, tool.tool_name)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Execute
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

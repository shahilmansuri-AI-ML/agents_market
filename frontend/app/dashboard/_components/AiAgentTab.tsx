 "use client";
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, Code2 } from "lucide-react";

export const AiAgentTab = () => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-10 px-4">
      <Tabs defaultValue="no-code" className="space-y-6">
        
        {/* Simplified Tab Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 transition-colors">
          <TabsList className="h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="no-code"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-zinc-500 dark:text-zinc-400 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none transition-all"
            >
              No-Code Templates
            </TabsTrigger>
            <TabsTrigger
              value="low-code"
              className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-zinc-500 dark:text-zinc-400 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none transition-all"
            >
              Low-Code Editor
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Professional Content Cards */}
        <TabsContent value="no-code" className="mt-0 focus-visible:outline-none">
          {/* Card Container: bg-zinc-50/50 -> dark:bg-zinc-900/30 */}
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl border-dashed group hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300">
            <div className="p-4 bg-white dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Create No-Code Agent</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[280px] text-center mt-1 mb-6">
              Start with a pre-configured template to deploy your agent in minutes.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="low-code" className="mt-0 focus-visible:outline-none">
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl border-dashed group hover:bg-white dark:hover:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300">
            <div className="p-4 bg-white dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Code2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Open Workflow Editor</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[280px] text-center mt-1 mb-6">
              Custom-code your agent logic and connect complex API endpoints.
            </p>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};
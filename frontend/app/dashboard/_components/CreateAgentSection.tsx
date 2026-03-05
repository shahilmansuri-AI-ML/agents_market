"use client";

import { useRouter } from "next/navigation";
import { Bot, Cpu, Zap } from "lucide-react";
import { AiAgentTab } from "./AiAgentTab";
import { AgentBuilderPreview } from "./AgentBuilderPreview";

export const CreateAgentSection = () => {
  const router = useRouter();

  return (
    // <div className="flex flex-col items-center py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
    <div>
      {/* 1. Bot Icon Badge */}
      <div className="mb-10 flex justify-center items-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm inline-flex items-center justify-center relative transition-transform hover:scale-105">
          <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
        </div>
      </div>

      {/* 2. Heading Section */}
      <div className="text-center mb-20 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          AI Marketplace{" "}
          <span className="text-indigo-600 dark:text-indigo-400">Engine</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Deploy autonomous AI agents in seconds. Professional-grade workflows
          designed for speed and scalability.
        </p>
      </div>

      {/* 3. Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-24">
        {[
          {
            icon: Bot,
            title: "Self-Reasoning",
            desc: "Agents that understand intent, not just simple commands.",
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            icon: Cpu,
            title: "Neural Workflows",
            desc: "Bridge LLMs with your private enterprise data safely.",
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
          },
          {
            icon: Zap,
            title: "Real-time Stats",
            desc: "Monitor agent execution and tokens with zero latency.",
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
          },
        ].map((feat, i) => (
          <div
            key={i}
            className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-300"
          >
            <div
              className={`p-3.5 rounded-xl inline-flex mb-6 transition-transform group-hover:scale-110 ${feat.bgColor} ${feat.color}`}
            >
              <feat.icon className="h-6 w-6" />
            </div>

            <h3 className="font-bold text-zinc-900 dark:text-white text-xl mb-3">
              {feat.title}
            </h3>

            <p className="text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 4. Build Interface Section */}
      <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-16">
        {/* Section Header */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Build Interface
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Choose your preferred development environment
          </p>
        </div>

        {/* Available Templates Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
            Available Templates
          </span>
        </div>

        {/* Tabs + Preview */}
        <AiAgentTab />

        <div className="mt-10">{/* <AgentBuilderPreview /> */}</div>
      </div>
    </div>
  );
};

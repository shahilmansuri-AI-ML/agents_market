"use client";

import { useRouter } from "next/navigation";
import { Bot, Cpu, Zap } from "lucide-react";
import { AiAgentTab } from "./AiAgentTab";
import { AgentBuilderPreview } from "./AgentBuilderPreview";

export const CreateAgentSection = () => {
  const router = useRouter();

  return (
    <>
      {/* ✅ THEME + FONT */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;

          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);

          --accent: #3B82F6;
          --accent-hover: #2563EB;
          --accent-2: #06B6D4;

          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
          --text-tertiary: #444C56;

          --success: #3FB950;
        }

        body {
          background: var(--bg);
          font-family: 'Syne', sans-serif;
        }

        .dashboard-root {
          min-height: 100vh;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }

        .dashboard-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(59,130,246,0.06), transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(6,182,212,0.05), transparent 70%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        button {
          font-family: 'Syne', sans-serif;
        }
      `}</style>

      {/* ✅ ROOT WRAPPER */}
      <div className="dashboard-root p-6 md:p-8">
        <div className="grid-overlay" />

        {/* 1. Bot Icon Badge */}
        <div className="mb-10 flex justify-center items-center">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-3xl shadow-sm inline-flex items-center justify-center relative transition-transform hover:scale-105">
            <Bot className="w-10 h-10 text-[var(--accent)]" />
            <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]"></span>
          </div>
        </div>

        {/* 2. Heading Section */}
        <div className="text-center mb-20 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
            AI Marketplace{" "}
            <span className="text-[var(--accent)]">Engine</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
            Deploy autonomous AI agents in seconds. Professional-grade workflows
            designed for speed and scalability.
          </p>
        </div>

        {/* 3. Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12 mb-24">
          {[
            {
              icon: Bot,
              title: "Self-Reasoning Agents",
              desc: "AI agents that understand context, break down complex tasks, and make intelligent decisions autonomously.",
              color: "text-blue-400",
              bgColor: "bg-blue-500/10",
            },
            {
              icon: Cpu,
              title: "Neural Workflow Engine",
              desc: "Design and automate workflows by connecting AI models, APIs, and tools into seamless pipelines.",
              color: "text-purple-400",
              bgColor: "bg-purple-500/10",
            },
            {
              icon: Zap,
              title: "Live Monitoring & Analytics",
              desc: "Track executions, token usage, and performance metrics in real time with full visibility and control.",
              color: "text-amber-400",
              bgColor: "bg-amber-500/10",
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] transition-all duration-300"
            >
              <div
                className={`p-3.5 rounded-xl inline-flex mb-6 transition-transform group-hover:scale-110 ${feat.bgColor} ${feat.color}`}
              >
                <feat.icon className="h-6 w-6" />
              </div>

              <h3 className="font-bold text-[var(--text-primary)] text-xl mb-3">
                {feat.title}
              </h3>

              <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 4. Build Interface Section */}
        <div className="w-full border-t border-[var(--border)] pt-16">
          {/* Section Header */}
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              Build Interface
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Choose your preferred development environment
            </p>
          </div>

          {/* Available Templates Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-widest">
              Available Templates
            </span>
          </div>
          {/* Tabs + Preview */}
          <AiAgentTab />

          <div className="mt-10">{/* <AgentBuilderPreview /> */}</div>
        </div>
      </div>
      {/* </> </div> */}
    </>
  );
};


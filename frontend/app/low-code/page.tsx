"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Play,
  Cpu,
  Terminal,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AppHeader } from "../dashboard/_components/AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function LowCodeAgentPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration error se bachne ke liye
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] text-zinc-900 dark:text-zinc-200 flex flex-col selection:bg-indigo-500/30 transition-colors duration-300">
      {/* --- BACKGROUND DESIGN --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 blur-[100px]" />
        <div className="absolute bottom-[0%] left-[-5%] w-[300px] h-[300px] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[100px]" />
      </div>

      {/* --- HEADER --- */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link href="/dashboard" className="flex items-center gap-0 group">
          <div className="p-1 rounded-xl">
            <ChevronLeft size={20} className="" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Agentra
          </span>
        </Link>

        {/* Theme Toogler Button */}
        {/* <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-110 transition-all"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button> */}
      </header>

      {/* --- MAIN SECTION --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="max-w-4xl w-full bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col gap-8">
          {/* Intro Text */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter italic">
              AGENT{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">
                LOGIC
              </span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-full leading-relaxed">
              Define your agent's personality and tools. Use simple syntax to
              connect workflows and deploy to the cloud instantly.
            </p>
          </div>

          {/* Simple Editor Box */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-10 group-hover:opacity-25 transition duration-500 blur" />

            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                  <Terminal size={14} className="text-indigo-500" />{" "}
                  agent_configuration.json
                </div>
                <Cpu size={14} className="text-zinc-400 dark:text-zinc-700" />
              </div>
              <textarea
                className="w-full min-h-[250px] bg-transparent text-zinc-800 dark:text-zinc-300 font-mono text-sm p-6 resize-none focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-800 leading-relaxed"
                placeholder="// Initialize your logic here..."
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
            <button className="group relative flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 active:scale-95 transition-all py-3.5 px-8 rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/10">
              <Play size={16} fill="currentColor" />
              DEPLOY AGENT
              <Sparkles
                size={14}
                className="text-indigo-500 group-hover:rotate-12 transition-transform"
              />
            </button>
            {/* <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">v1.0.4 stable</p> */}
          </div>
        </div>
      </main>
    </div>
  );
}

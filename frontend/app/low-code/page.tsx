"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Play,
  Save,
  Terminal,
  Cpu,
} from "lucide-react";

export default function CodeEditorPage() {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your code here...");
  const [output, setOutput] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const handleRun = async () => {
    setOutput("Running...");

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setOutput(data.output);
    } catch (error) {
      setOutput("Error running code");
    }
  };

  const handleSave = () => {
    console.log("Saved Code:", code);
    alert("Code Saved ✅");
  };

  return (
    <>
      {/* THEME + FONT */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;

          --border: rgba(255,255,255,0.06);

          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
        }

        body, * {
          font-family: 'Syne', sans-serif !important;
        }

        .app-root {
          min-height: 100vh;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }
      `}</style>

      <div className="app-root text-[var(--text-primary)] flex flex-col">

        {/* Background Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute bottom-[0%] left-[-5%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        {/* Header */}
       <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)] gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <ChevronLeft size={20} />
            <span className="text-xl font-bold">Code Editor</span>
          </Link>
        </header>

        {/* Main */}
        <main className="relative z-10 flex-1 flex flex-col px-6 pt-6 pb-10">

          <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">

            {/* Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              {/* Buttons */}
              <div className="flex gap-3 ml-4">
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600  hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                >
                  <Play size={16} />
                  Run
                </button>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] px-5 py-2 rounded-lg text-sm font-semibold transition"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>

            {/* Editor + Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Code Editor */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-inner">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
                    <Terminal size={14} className="text-indigo-500" />
                    main.{language}
                  </div>
                  <Cpu size={14} className="text-[var(--text-secondary)]" />
                </div>

                {/* Textarea */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full min-h-[400px] p-4 bg-transparent outline-none font-['DM_Mono'] text-sm text-[var(--text-primary)] resize-none"
                />
              </div>

              {/* Output Panel */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] text-green-400 font-mono text-sm">

                <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]">
                  Output
                </div>

                <pre className="p-4 whitespace-pre-wrap min-h-[400px]">
                  {output || "// Output will appear here"}
                </pre>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

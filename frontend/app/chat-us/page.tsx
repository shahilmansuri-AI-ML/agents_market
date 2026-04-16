"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  ChevronLeft,
  PanelLeft,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BotMessageSquare,
  User,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Wand2,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api-client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ================= TYPES ================= */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  liked?: boolean | null;
  isLoading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  agentId: string | number;
  messages: Message[];
  createdAt: number;
}

/* ================= HELPERS ================= */

const STORAGE_KEY = "agentra_multi_agent_chat_v10";
const LAST_AGENT_KEY = "agentra_last_selected_agent_v1";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const normalizeMessageContent = (content: string) => {
  if (!content) return "";

  let text = String(content)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\\\"/g, '"')
    .replace(/\r\n/g, "\n");

  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }

  return text.trim();
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  const normalized = normalizeMessageContent(content);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-headings:leading-snug prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-7 prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-[#0b1220] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-3 prose-code:text-sky-300 prose-strong:text-white prose-blockquote:border-l-sky-500 prose-blockquote:text-zinc-300 prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { inline, className, children, ...rest } = props as any;

            if (inline) {
              return (
                <code
                  className="rounded-md bg-white/10 px-1.5 py-0.5 text-sky-300 text-[0.92em]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="overflow-x-auto rounded-xl p-3">
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-white/10 bg-white/5 px-3 py-2 text-left text-sm">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-white/5 px-3 py-2 text-sm">
                {children}
              </td>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

/* ================= MAIN ================= */

export default function ChatPage() {
  /* ================= STATES ================= */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [model, setModel] = useState("GPT-4");
  const [input, setInput] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ================= LOCAL STORAGE ================= */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setConversations(parsed);
      }
    } catch (err) {
      console.error("Failed to load stored conversations:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (err) {
      console.error("Failed to persist conversations:", err);
    }
  }, [conversations]);

  /* ================= FETCH AGENTS ================= */
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.get("/single_agents", {
          requireAuth: true,
          requireTenant: true,
        });

        setAgents(data || []);

        const lastSelectedAgentId = localStorage.getItem(LAST_AGENT_KEY);
        if (lastSelectedAgentId && Array.isArray(data)) {
          const found = data.find((a: any) => String(a.id) === lastSelectedAgentId);
          if (found) setSelectedAgent(found);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent?.id) {
      localStorage.setItem(LAST_AGENT_KEY, String(selectedAgent.id));
    }
  }, [selectedAgent]);

  /* ================= AUTO RESIZE TEXTAREA ================= */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConversationId]);

  /* ================= HELPERS ================= */
  const filteredHistory = selectedAgent
    ? conversations.filter((c) => String(c.agentId) === String(selectedAgent.id))
    : [];

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const updateConversation = (
    conversationId: string,
    updater: (conversation: Conversation) => Conversation
  ) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? updater(c) : c))
    );
  };

  const createNewConversation = () => {
    setActiveConversationId(null);
    setInput("");
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (customInput?: string) => {
    const textToSend = (customInput || input).trim();
    if (!textToSend || !selectedAgent || isExecuting) return;

    const conversationId = activeConversationId || generateId();

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: textToSend,
      time: getTime(),
    };

    setConversations((prev) => {
      const exists = prev.find((c) => c.id === conversationId);

      if (!exists) {
        return [
          {
            id: conversationId,
            title: textToSend.slice(0, 40),
            agentId: selectedAgent.id,
            messages: [userMsg],
            createdAt: Date.now(),
          },
          ...prev,
        ];
      }

      return prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, userMsg] }
          : c
      );
    });

    setActiveConversationId(conversationId);
    setInput("");
    setIsExecuting(true);

    const loadingMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "Thinking...",
      time: "Just now",
      liked: null,
      isLoading: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, loadingMsg] }
          : c
      )
    );

    try {
      const tenantId = localStorage.getItem("tenant_id");

      try {
        await api.post(
          "/deployments/deploy-agent",
          {
            agent_id: selectedAgent.id,
            tenant_id: tenantId || "",
            agent_type: "single",
          },
          { requireAuth: true, requireTenant: true }
        );
      } catch (deployError) {
        console.warn("Agent deploy step failed (may already be deployed):", deployError);
      }

      const response = await api.post(
        "/executions/run",
        {
          target_id: selectedAgent.id,
          tenant_id: tenantId,
          agent_type: "single",
          text: textToSend,
        },
        {
          requireAuth: true,
          requireTenant: true,
        }
      );

      const assistantText =
        response?.response || response?.data?.response || "No response";

      const botMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: assistantText,
        time: "Just now",
        liked: null,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          const updatedMessages = c.messages.filter((msg) => !msg.isLoading);

          return {
            ...c,
            messages: [...updatedMessages, botMsg],
          };
        })
      );
    } catch (err: any) {
      console.error("Execution failed", err);

      const errorText =
        err?.response?.data?.detail ||
        err?.message ||
        "Agent execution failed.";

      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `## Error\n\n❌ ${errorText}`,
        time: "Just now",
        liked: null,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          const updatedMessages = c.messages.filter((msg) => !msg.isLoading);

          return {
            ...c,
            messages: [...updatedMessages, errorMsg],
          };
        })
      );
    } finally {
      setIsExecuting(false);
    }
  };

  /* ================= REGENERATE ================= */
  const regenerateLastResponse = async () => {
    if (!activeConversation || isExecuting) return;

    const lastUserMessage = [...activeConversation.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;

    updateConversation(activeConversation.id, (c) => ({
      ...c,
      messages: c.messages.filter(
        (msg, index, arr) =>
          !(msg.role === "assistant" && index === arr.length - 1)
      ),
    }));

    await sendMessage(lastUserMessage.content);
  };

  /* ================= FEEDBACK ================= */
  const handleFeedback = (
    conversationId: string,
    messageId: string,
    value: boolean
  ) => {
    updateConversation(conversationId, (c) => ({
      ...c,
      messages: c.messages.map((msg) =>
        msg.id === messageId ? { ...msg, liked: value } : msg
      ),
    }));
  };

  /* ================= COPY ================= */
  const handleCopy = async (messageId: string, content: string) => {
    const ok = await copyToClipboard(normalizeMessageContent(content));
    if (!ok) return;

    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  /* ================= SIDEBAR ================= */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-base"
        >
          <ChevronLeft size={16} /> Agentra
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="hidden md:flex h-8 w-8"
        >
          <PanelLeft size={16} />
        </Button>
      </div>

      <div className="px-3 py-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
        <Button
          variant="outline"
          className="w-full justify-start gap-2.5 rounded-xl border-dashed border-white/15 bg-white/5 hover:bg-white/10 text-sm h-10"
          onClick={createNewConversation}
        >
          <Plus size={16} /> New conversation
        </Button>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
              <Cpu size={13} />
              Agents
            </div>
            <div className="text-sm font-semibold text-white">{agents.length}</div>
          </div>

          {/* <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
              <ShieldCheck size={13} />
              Mode
            </div>
            <div className="text-sm font-semibold text-white">Single</div>
          </div> */}
        </div>

        <div className="space-y-1.5 mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
            Recent conversations
          </p>

          {filteredHistory.length === 0 && (
            <div className="text-sm text-zinc-500 px-2 py-4">
              No chats for this agent yet.
            </div>
          )}

          {filteredHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveConversationId(chat.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${activeConversationId === chat.id
                ? "bg-white/10 border-white/15"
                : "hover:bg-white/5 border-transparent"
                }`}
            >
              <div className="flex items-center gap-2.5 truncate text-sm min-w-0">
                <MessageSquare size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>

              <Trash2
                size={14}
                className="opacity-0 group-hover:opacity-100 text-red-400 transition shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setConversations((prev) =>
                    prev.filter((c) => c.id !== chat.id)
                  );
                  if (activeConversationId === chat.id) {
                    setActiveConversationId(null);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================= HEADER ================= */
  const Header = () => (
    <header className="h-14 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-4 md:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
              <PanelLeft size={18} />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-72 bg-[#0D1117] border-r border-white/10">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {!sidebarOpen && (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="font-semibold text-lg">
              Agentra
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <PanelLeft size={16} />
            </Button>
          </div>
        )}

        <div
          className={`flex items-center gap-3 min-w-0 ${!sidebarOpen ? "border-l pl-4 border-white/10" : ""
            }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Bot size={18} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-tight text-sm md:text-[15px] truncate">
              {selectedAgent?.name || "Select Agent"}
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              {selectedAgent ? "Active AI Agent" : "Choose an agent to begin"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>

        <Select
          value={selectedAgent?.id?.toString() || "select_placeholder"}
          onValueChange={(val) => {
            if (val === "select_placeholder") return;

            const found = agents.find((a) => String(a.id) === val) || null;
            setSelectedAgent(found);
            setActiveConversationId(null);
          }}
        >
          <SelectTrigger className="w-[165px] md:w-[185px] rounded-xl h-9 bg-white/5 border-white/10 text-sm">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="select_placeholder" disabled>
              Select Agent
            </SelectItem>

            {agents.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );

  /* ================= UI ================= */
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg: #070b11;
          --surface: rgba(10, 14, 21, 0.86);
          --surface-2: rgba(16, 22, 32, 0.82);
          --surface-3: rgba(255, 255, 255, 0.03);

          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.14);

          --accent: #6366f1;
          --accent-2: #06b6d4;

          --text-primary: #f5f7fb;
          --text-secondary: #9aa4b2;
          --text-tertiary: #6b7280;
        }

        html, body, * {
          font-family: 'Inter', sans-serif !important;
        }

        code, pre {
          font-family: 'DM Mono', monospace !important;
        }

        .app-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(99,102,241,0.16), transparent 24%),
            radial-gradient(circle at bottom right, rgba(6,182,212,0.10), transparent 24%),
            linear-gradient(180deg, #06080d 0%, #0b1020 100%);
          position: relative;
          overflow: hidden;
        }

        .app-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 45% 35% at 18% 18%, rgba(99,102,241,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 35% 35% at 82% 82%, rgba(6,182,212,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
          mask-image: radial-gradient(circle at center, black 35%, transparent 100%);
        }

        .glass-card {
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 7px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
        }
      `}</style>

      <div className="app-root flex h-screen text-[var(--text-primary)]">
        <div className="grid-overlay" />

        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col border-r border-white/10 transition-all duration-300 relative z-10 ${sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden"
            }`}
        >
          <SidebarContent />
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10">
          <Header />

          {/* ================= CHAT AREA ================= */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-3 md:px-6 py-5">
              {!selectedAgent ? (
                <div className="h-[68vh] flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                    <Bot size={28} className="text-indigo-300" />
                  </div>

                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
                      Pick an agent to begin
                    </h2>
                    <p className="text-zinc-400 max-w-lg text-sm md:text-[15px] leading-7">
                      Select one of your deployed AI agents and continue your workspace conversations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-2">
                    {[
                      {
                        icon: <Cpu size={16} />,
                        title: "Agent-powered sessions",
                        desc: "Each conversation stays tied to its selected agent.",
                      },
                      {
                        icon: <ShieldCheck size={16} />,
                        title: "Production-ready flow",
                        desc: "Clean interaction patterns for real daily usage.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3 text-indigo-300">
                          {item.icon}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                        <p className="text-sm text-zinc-400 leading-6">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !activeConversation ? (
                <div className="h-[68vh] flex flex-col items-center justify-center space-y-7">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shadow-xl shadow-indigo-500/10 mb-4">
                      <Wand2 size={28} className="text-indigo-300" />
                    </div>

                    <h1 className="text-2xl md:text-4xl font-semibold text-center tracking-tight leading-tight max-w-3xl">
                      How can{" "}
                      <span className="bg-gradient-to-r from-indigo-300 via-white to-cyan-300 bg-clip-text text-transparent">
                        {selectedAgent.name}
                      </span>{" "}
                      help today?
                    </h1>

                    <p className="text-zinc-400 mt-3 max-w-2xl mx-auto text-sm md:text-[15px] leading-7">
                      Ask for debugging, architecture advice, code help, refactoring, backend fixes, UI polish, or workflow improvements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl px-2">
                    {[
                      "Analyze my backend architecture and suggest improvements",
                      "Improve this frontend to production SaaS quality",
                      "Debug my FastAPI deployment issue",
                      "Refactor my API and make it scalable",
                    ].map((label) => (
                      <button
                        key={label}
                        onClick={() => sendMessage(label)}
                        className="group relative overflow-hidden p-4 rounded-2xl border bg-white/5 border-white/10 text-left text-sm font-medium transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/8 hover:-translate-y-0.5 active:scale-[0.98]"
                      >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent" />

                        <div className="relative flex items-center justify-between gap-3">
                          <span className="text-zinc-100 leading-6">{label}</span>

                          <Sparkles
                            size={15}
                            className="text-indigo-400 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out shrink-0"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-8">
                  {activeConversation.messages.map((msg) => (
                    <div key={msg.id} className="space-y-2.5">
                      <div
                        className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                      >
                        {/* Assistant Avatar */}
                        {msg.role === "assistant" && (
                          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
                            <BotMessageSquare size={17} />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`glass-card max-w-[94%] md:max-w-[78%] px-4 md:px-5 py-3.5 md:py-4 rounded-2xl text-[15px] transition-all border shadow-lg ${msg.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-indigo-400/20 rounded-br-md shadow-indigo-500/20"
                            : "bg-white/6 text-zinc-100 border-white/10 rounded-bl-md"
                            }`}
                        >
                          {msg.isLoading ? (
                            <TypingDots />
                          ) : (
                            <MarkdownMessage content={msg.content} />
                          )}

                          <div
                            className={`mt-3 flex items-center justify-between text-[11px] ${msg.role === "user" ? "text-indigo-100/80" : "text-zinc-500"
                              }`}
                          >
                            <span>{msg.time}</span>

                            {msg.role === "assistant" && !msg.isLoading && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10 transition"
                                >
                                  {copiedMessageId === msg.id ? (
                                    <>
                                      <Check size={12} /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User Avatar */}
                        {msg.role === "user" && (
                          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-zinc-100 shadow-lg">
                            <User size={17} />
                          </div>
                        )}
                      </div>

                      {/* Assistant Actions */}
                      {msg.role === "assistant" &&
                        activeConversationId &&
                        !msg.isLoading && (
                          <div className="flex gap-2 ml-12 text-zinc-400">
                            <button
                              onClick={() =>
                                handleFeedback(activeConversationId, msg.id, true)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs transition hover:text-green-400 hover:border-green-500/30 ${msg.liked === true
                                ? "text-green-400 border-green-500/30 bg-green-500/10"
                                : "border-white/10"
                                }`}
                            >
                              <ThumbsUp size={13} />
                              Helpful
                            </button>

                            <button
                              onClick={() =>
                                handleFeedback(activeConversationId, msg.id, false)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs transition hover:text-red-400 hover:border-red-500/30 ${msg.liked === false
                                ? "text-red-400 border-red-500/30 bg-red-500/10"
                                : "border-white/10"
                                }`}
                            >
                              <ThumbsDown size={13} />
                              Not useful
                            </button>
                          </div>
                        )}
                    </div>
                  ))}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* ================= INPUT ================= */}
          <div className="px-3 md:px-6 pb-4 md:pb-5">
            <div className="max-w-4xl mx-auto">
              <div className="glass-card rounded-2xl bg-white/6 border border-white/10 px-4 md:px-5 py-3.5 shadow-xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isExecuting) sendMessage();
                    }
                  }}
                  disabled={!selectedAgent || isExecuting}
                  rows={1}
                  placeholder={`Message ${selectedAgent?.name || "Assistant"}...`}
                  className="w-full resize-none bg-transparent outline-none text-[15px] text-zinc-100 placeholder:text-zinc-500 disabled:opacity-50 max-h-[180px] leading-7"
                />

                <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-[135px] rounded-full bg-white/5 border border-white/10 h-9 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="GPT-4">GPT-4</SelectItem>
                        <SelectItem value="GPT-4 Turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="Claude">Claude</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={regenerateLastResponse}
                      disabled={isExecuting || !activeConversation?.messages?.length}
                      className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 h-9 text-xs"
                    >
                      <RotateCcw size={14} className="mr-2" />
                      Regenerate
                    </Button>
                  </div>

                  <Button
                    onClick={() => sendMessage()}
                    disabled={!selectedAgent || !input.trim() || isExecuting}
                    className="rounded-full h-10 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={15} />
                        Thinking
                      </>
                    ) : (
                      <>
                        <Send size={15} className="mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-center text-[11px] text-zinc-500 mt-2.5">
                AI responses may be imperfect. Verify important code, architecture, and deployment decisions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
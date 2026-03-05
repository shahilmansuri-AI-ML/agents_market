"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

export default function ChatPage() {
  /* ================= STATES ================= */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [model, setModel] = useState("GPT-4");
  const [input, setInput] = useState("");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= FETCH AGENTS ================= */
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/single_agents/`,
        );
        if (res.ok) setAgents(await res.json());
      } catch {
        console.error("Failed to fetch agents");
      }
    };
    fetchAgents();
  }, []);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = (customInput?: string) => {
    const textToSend = (customInput || input).trim();
    if (!textToSend || !selectedAgent) return;

    const id = activeConversationId || Date.now().toString();

    const userMsg = {
      role: "user",
      content: textToSend,
      time: new Date().toLocaleTimeString(),
    };

    setConversations((prev) => {
      const exists = prev.find((c) => c.id === id);

      if (!exists) {
        return [
          {
            id,
            title: textToSend.slice(0, 30),
            agentId: selectedAgent.id,
            messages: [userMsg],
          },
          ...prev,
        ];
      }

      return prev.map((c) =>
        c.id === id ? { ...c, messages: [...c.messages, userMsg] } : c,
      );
    });

    setActiveConversationId(id);
    setInput("");

    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    botTimeoutRef.current = setTimeout(() => {
      const botMsg = {
        role: "assistant",
        content: `I'm ${selectedAgent.name}. How can I assist you with "${textToSend}"?`,
        time: "Just now",
        liked: null,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, messages: [...c.messages, botMsg] } : c,
        ),
      );
    }, 600);
  };

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, []);

  /* ================= FEEDBACK ================= */
  const handleFeedback = (convId: string, index: number, value: boolean) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated = [...c.messages];
        updated[index] = { ...updated[index], liked: value };
        return { ...c, messages: updated };
      }),
    );
  };

  /* ================= DERIVED ================= */
  const filteredHistory = selectedAgent
    ? conversations.filter((c) => c.agentId === selectedAgent.id)
    : [];

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  /* ================= SIDEBAR ================= */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <ChevronLeft size={18} /> Agentra
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="hidden md:flex"
        >
          <PanelLeft size={18} />
        </Button>
      </div>

      <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl border-dashed"
          onClick={() => setActiveConversationId(null)}
        >
          <Plus size={18} /> New conversation
        </Button>

        <div className="space-y-1 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
            Recent
          </p>

          {filteredHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveConversationId(chat.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                activeConversationId === chat.id
                  ? "bg-slate-100 dark:bg-zinc-900"
                  : "hover:bg-slate-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <div className="flex items-center gap-3 truncate text-sm">
                <MessageSquare size={14} className="text-slate-400" />
                {chat.title}
              </div>

              <Trash2
                size={14}
                className="opacity-0 group-hover:opacity-100 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setConversations((prev) =>
                    prev.filter((c) => c.id !== chat.id),
                  );
                  if (activeConversationId === chat.id)
                    setActiveConversationId(null);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================= HEADER (FIXED STRUCTURE) ================= */
  const Header = () => (
    <header className="h-16 bg-white dark:bg-[#030303] border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* MOBILE SIDEBAR */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <PanelLeft size={20} />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* BRAND + TOGGLE */}
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <>
              <ChevronLeft size={20} />
              <Link href="/dashboard" className="font-bold text-xl">
                Agentra
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft size={18} />
              </Button>
            </>
          )}
        </div>

        {/* AGENT NAME */}
        <div
          className={`flex items-center gap-2 ${
            !sidebarOpen
              ? "border-l pl-4 border-slate-200 dark:border-zinc-800"
              : ""
          }`}
        >
          <Bot size={20} className="text-indigo-600" />
          <span className="font-semibold">
            {selectedAgent?.name || "Assistant"}
          </span>
        </div>
      </div>

      {/* RIGHT — SELECT */}
      <Select
        value={selectedAgent?.id?.toString() || "select_placeholder"}
        onValueChange={(val) => {
          if (val === "select_placeholder") return;

          setSelectedAgent(agents.find((a) => String(a.id) === val) || null);
          setActiveConversationId(null);
        }}
      >
        <SelectTrigger className="w-[160px] rounded-xl h-9 bg-slate-100 dark:bg-zinc-900 border-gray-300">
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
    </header>
  );

  /* ================= UI ================= */
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-zinc-200">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* ✅ CLEAN HEADER */}
        <Header />

        {/* ================= CHAT AREA ================= */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            {!selectedAgent ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <Bot size={40} className="text-indigo-600" />
                <h2 className="text-xl text-slate-500">
                  Pick an agent to start your session
                </h2>
              </div>
            ) : !activeConversation ? (
              <div className="h-[70vh] flex flex-col items-center justify-center space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold text-center">
                  How can{" "}
                  <span className="text-indigo-600">{selectedAgent.name}</span>{" "}
                  help you today?
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                  {[
                    "Improve my writing",
                    "Explain quantum physics",
                    "Draft a professional email",
                    "Write a code snippet",
                  ].map((label) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(label)}
                      className="
                  group relative overflow-hidden
                  p-4 rounded-2xl border
                  bg-white dark:bg-zinc-900
                  border-slate-200 dark:border-zinc-800
                  text-left text-sm font-medium
                  transition-all duration-300
                  hover:border-indigo-500
                  hover:shadow-lg hover:shadow-indigo-500/10
                  hover:-translate-y-0.5
                  active:scale-[0.98]
                "
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent" />

                      <div className="relative flex items-center justify-between">
                        <span>{label}</span>

                        <Sparkles
                          size={16}
                          className="
                      text-indigo-500
                      opacity-0 scale-75
                      group-hover:opacity-100
                      group-hover:scale-100
                      transition-all duration-300 ease-out
                    "
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-10">
               {activeConversation?.messages.map((msg : any, i : number) => (
              <div key={i} className="space-y-2">
                <div
                  className={`flex items-end gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* ✅ Assistant Icon */}
                  {msg.role === "assistant" && (
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                      <BotMessageSquare />
                    </div>
                  )}

                  {/* ✅ Message Bubble */}
                  <div
                    className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm transition-colors
        ${
          msg.role === "user"
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-bl-md"
        }`}
                  >
                    {msg.content}
                  </div>

                  {/* ✅ User Icon */}
                  {msg.role === "user" && (
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      <User />
                    </div>
                  )}
                </div>

                {/* ✅ Feedback Buttons */}
                {msg.role === "assistant" && activeConversationId && (
                  <div className="flex gap-4 ml-12 text-zinc-400">
                    {/* 👍 LIKE */}
                    <ThumbsUp
                      size={16}
                      onClick={() =>
                        handleFeedback(activeConversationId, i, true)
                      }
                      className={`
        cursor-pointer transition-all
        hover:text-green-500
        ${msg.liked === true ? "text-green-500 fill-green-500" : ""}
      `}
                    />

                    {/* 👎 DISLIKE */}
                    <ThumbsDown
                      size={16}
                      onClick={() =>
                        handleFeedback(activeConversationId, i, false)
                      }
                      className={`
        cursor-pointer transition-all
        hover:text-red-500
        ${msg.liked === false ? "text-red-500 fill-red-500" : ""}
      `}
                    />
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
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-50 dark:from-[#030303]">
          <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border rounded-3xl p-3 shadow-lg">
            <input
              className="w-full bg-transparent outline-none text-lg px-4 py-2"
              placeholder={`Message ${selectedAgent?.name || "Assistant"}...`}
              value={input}
              disabled={!selectedAgent}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (input.trim()) sendMessage();
                }
              }}
            />

            <div className="flex justify-between items-center px-2">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[120px] rounded-full bg-slate-100 dark:bg-zinc-800 border-none h-8 text-[10px] font-bold">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="GPT-4 Turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="Claude">Claude</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => sendMessage()}
                disabled={!selectedAgent || !input.trim()}
                size="icon"
                className="bg-indigo-600 rounded-full h-10 w-10"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

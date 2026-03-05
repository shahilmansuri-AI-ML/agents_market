"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
  BotMessageSquare,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= TYPES ================= */

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  liked?: boolean | null;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function SingleAgentChatPage() {
  /* ================= PARAM ================= */

  const params = useParams();
  const agentId = params.agent_id as string;

  /* ================= STATE ================= */

  const [agentName, setAgentName] = useState("");
  const [toolName, setToolName] = useState("");
  const [model, setModel] = useState("GPT-4");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ================= FETCH AGENT ================= */

  useEffect(() => {
    if (!agentId) return;

    const fetchAgent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/single_agents/${agentId}`,
        );

        if (!res.ok) return;

        const data = await res.json();

        setAgentName(data?.name ?? "Assistant");
        setToolName(data?.tool?.tool_name ?? "Tool");
        setModel(data?.model ?? "GPT-4");
      } catch (err) {
        console.error(err);
      }
    };

    fetchAgent();
  }, [agentId]);

  /* ================= HELPERS ================= */

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const ensureConversation = () => {
    if (activeConversationId) return activeConversationId;

    const id = Date.now().toString();

    const newConv: Conversation = {
      id,
      title: "New conversation",
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);

    return id;
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = () => {
    if (!input.trim()) return;

    const convId = ensureConversation();
    if (!convId) return;

    const userText = input.trim();

    const userMessage: Message = {
      role: "user",
      content: userText,
      time: getTime(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? userText.slice(0, 30) : c.title,
              messages: [...c.messages, userMessage],
            }
          : c,
      ),
    );

    setInput("");

    setTimeout(() => {
      const botMessage: Message = {
        role: "assistant",
        content: `I'm ${
          agentName || "your assistant"
        }. How can I help you further?`,
        time: getTime(),
        liked: null,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, botMessage] } : c,
        ),
      );
    }, 600);
  };

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

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const createNewConversation = () => {
    const id = Date.now().toString();

    const newConv: Conversation = {
      id,
      title: "New conversation",
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
  };

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

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

          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveConversationId(chat.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition
          ${
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
                className="opacity-0 group-hover:opacity-100 text-red-500 transition"
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
          <h1>{agentName || "Loading..."}</h1>
        </div>
      </div>

      {/* RIGHT — SELECT */}
      <div className="flex items-center gap-3">
        {/* ACTIVE STATUS */}
        <span
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
    bg-green-100 text-green-700
    dark:bg-green-500/10 dark:text-green-400"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Active
        </span>

        {/* TOOL NAME */}
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold
    bg-indigo-50 text-indigo-600
    dark:bg-indigo-500/10 dark:text-indigo-400"
        >
          {toolName || "Loading..."}
        </span>
      </div>
    </header>
  );

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-zinc-200">
      {/* ================= SIDEBAR ================= */}

      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ================= MAIN ================= */}

      <main className="flex-1 flex flex-col">
        {/* HEADER */}

        <Header />

        {/* CHAT AREA */}

        <div className="flex-1 overflow-y-auto px-8 py-10">
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* EMPTY CHAT + SUGGESTIONS */}

            {(!activeConversation ||
              activeConversation.messages.length === 0) && (
              <div className="flex flex-col items-center text-center mt-28">
                <h1 className="text-4xl font-semibold mb-10">
                  How can{" "}
                  <span className="text-indigo-500">
                    {agentName || "Assistant"}
                  </span>{" "}
                  help you today?
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                  {[
                    "Improve my writing",
                    "Explain quantum physics",
                    "Draft a professional email",
                    "Write a code snippet",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setInput(item)}
                      className="
        text-left px-6 py-4 rounded-2xl
        bg-white dark:bg-[#111216]
        border border-zinc-200 dark:border-zinc-800
        text-zinc-800 dark:text-zinc-200
        hover:border-indigo-500/50
        hover:bg-zinc-50 dark:hover:bg-[#18181c]
        hover:shadow-md dark:hover:shadow-none
        hover:scale-[1.02]
        active:scale-[0.98]
        transition-all duration-200
      "
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}

            {activeConversation?.messages.map((msg, i) => (
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
        </div>

        {/* INPUT */}

        <div className="px-8 pb-8">
          <div
            className="
      max-w-4xl mx-auto rounded-3xl
      bg-white dark:bg-[#111216]
      border border-zinc-200 dark:border-zinc-800
      px-6 py-5
      shadow-sm dark:shadow-none
      transition-colors duration-300
    "
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message ${agentName || "Assistant"}...`}
              className="
        w-full bg-transparent outline-none text-lg
        text-zinc-800 dark:text-zinc-200
        placeholder:text-zinc-400 dark:placeholder:text-zinc-500
        mb-5
      "
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

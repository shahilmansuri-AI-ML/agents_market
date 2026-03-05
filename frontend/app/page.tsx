import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bot, ArrowRight, Zap, Cpu } from "lucide-react";

const Home = () => {
  return (
    // Main Container: Dark background, center everything
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      {/* Content Wrapper */}
      <div className="max-w-3xl text-center space-y-8 ">
        {/* Icon & Title */}
        <div className="flex flex-col items-center gap-4 ">
          <div className="p-4 bg-blue-600/20 rounded-2xl hover:bg-blue-200">
            <Bot className="w-12 h-12 text-blue-400 " />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Deploy Your <span className="text-blue-500">AI Agents</span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
          Create, manage, and scale autonomous workflows. Let your AI agents
          handle the repetitive work while you focus on the big picture.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 ">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-blue-500 hover:bg-slate-900 px-10"
            >
              Launch Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>

      {/* Feature Highlights */}
      <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:bg-slate-700">
          <Bot className="h-8 w-8 text-blue-400" />
          <h3 className="font-bold text-white">Self-Reasoning</h3>
          <p className="text-sm text-slate-400">
            Agents that understand intent, not just commands.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:bg-slate-700">
          <Cpu className="h-8 w-8 text-purple-400" />
          <h3 className="font-bold text-white">Neural Workflows</h3>
          <p className="text-sm text-slate-400">
            Connect LLMs to your private data and tools securely.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:bg-slate-700">
          <Zap className="h-8 w-8 text-amber-400" />
          <h3 className="font-bold text-white">Real-time Execution</h3>
          <p className="text-sm text-slate-400">
            Watch your agents work across platforms in milliseconds.
          </p>
        </div>

      </div>


    </div>
  );
};

export default Home;

"use client";
import { useState } from "react";

export const AgentBuilderPreview = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Create AI Agent Node",
      heading: "1. Create AI Agent Node",
      video: "/videos/1.mov",
      description: [
        "The foundation of your AI agent. This node accepts input from a trigger (usually an On Chat Message). You can define the Agent's behaviour using system prompts. Adjust settings using Next.js. You may even add authentication to control access.",
      ],
    },
    {
      title: "Add LLM and Memory",
      heading: "2. Add LLM and Memory",
      video: "/videos/2.mov",
      description: [
        "Connect the LLM of your choosing. This is what your agent uses to evaluate data and make replies. Then, attach a memory node to your agent to keep context over long sessions, retain knowledge, and recall prior steps.",
      ],
    },
    {
      title: "Add AI Agent Tools",
      heading: "3. Add AI Agent Tools",
      video: "/videos/3.mov",
      description: [
        "Provide your agent with the tools they need to take actions, retrieve data, and start other processes. Use pre-made nodes or unique HTTP requests to connect to applications and services.",
      ],
    },
    {
      title: "Iterate, test, refine",
      heading: "4. Iterate, test, refine",
      video: "/videos/4.mov",
      description: [
        "Use deterministic logic to make the outputs more predictable. Debug with inline logs and compare new workflow runs to past execution data.",
      ],
    },
  ];

  const current = steps[activeStep];

  return (
    <div className="mt-10 w-full transition-colors duration-300">
      
      {/* STEP HEADER */}
      <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-10 overflow-x-auto sm:overflow-x-visible">
        {steps.map((step, index) => (
          <div
            key={index}
            onClick={() => setActiveStep(index)}
            className="flex-1 min-w-[120px] cursor-pointer text-center group"
          >
            <p
              className={`text-base transition-colors ${
                activeStep === index
                  ? "text-zinc-900 dark:text-white font-bold"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {step.title}
            </p>

            <div
              className={`mt-3 h-[2px] transition-all duration-300 ${
                activeStep === index
                  ? "bg-indigo-600 dark:bg-blue-500 w-full"
                  : "bg-transparent w-0 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 group-hover:w-full"
              }`}
            />
          </div>
        ))}
      </div>

      {/* CONTENT SECTION */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        
        {/* LEFT SIDE */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {current.heading}
          </h2>

          <div className="text-zinc-600 dark:text-zinc-400 space-y-4 leading-relaxed">
            {current.description.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE VIDEO FRAME */}
        <div className="relative w-full aspect-video rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-blue-500/20">
          
          <video
            key={current.video}
            src={current.video}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Optional gradient overlay - subtle light mode, stronger dark mode */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-black/60 to-transparent pointer-events-none" />
        </div>

      </div>
    </div>
  );
};
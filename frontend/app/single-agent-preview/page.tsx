"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sparkles, ClipboardList, Info, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export default function AgentPreviewModal() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const savedData = localStorage.getItem("agentForm");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(parsed);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const handleSubmit = async () => {
    // ✅ Data validation directly from formData (since form state is empty)
    if (
      !formData?.tenant_id ||
      !formData?.name ||
      !formData?.tool_id ||
      !formData?.instruction
    ) {
      toast.error("Required data missing from form");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/single_agents",
        {
          name: formData.name,
          description: formData.description || "",
          instruction: formData.instruction,
          tool_id: Number(formData.tool_id),
          tenant_id: formData.tenant_id,
        },
        {
          requireAuth: true,
          requireTenant: true,
        },
      );

      toast.success("Agent created successfully!");
      localStorage.removeItem("agentForm");

      // ✅ Redirect to registry after success
      router.push("/dashboard/agent-registry");
    } catch (err: any) {
      console.error("Agent creation error:", err);
      toast.error(err.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const previewImage =
    resolvedTheme === "dark"
      ? "/photos/preview_dark.png"
      : "/photos/preview_light.png";

  return (
    <>
      <style jsx global>{`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    --bg: #080B0F;
    --surface: #0D1117;
    --border: rgba(255,255,255,0.06);
  }

  /* Overlay background */
  [data-radix-dialog-overlay] {
    background: rgba(8,11,15,0.85) !important;
    backdrop-filter: blur(6px);
  }

  /* Modal background ONLY */
  [data-radix-dialog-content] {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    position: relative;
    overflow: hidden;
  }

  /* Grid pattern */
  [data-radix-dialog-content]::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    border-radius: inherit;
  }

  /* Gradient glow */
  [data-radix-dialog-content]::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12), transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(6,182,212,0.08), transparent 60%);
    pointer-events: none;
    border-radius: inherit;
  }

  /* Keep content above background */
  [data-radix-dialog-content] > * {
    position: relative;
    z-index: 1;
  }
`}</style>

      <Dialog open={open} onOpenChange={handleClose}>
        {/* Max-width increased to 1000px for larger image visibility */}
        <DialogContent
          className="sm:max-w-[1500px] rounded-3xl border border-zinc-200 dark:border-zinc-800 
bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl 
shadow-2xl shadow-black/20 dark:shadow-black/50 
mt-6 [&>button]:hidden"
        >
          {/* GRID BACKGROUND */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* GLOW EFFECT */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.1), transparent 60%)",
            }}
          />
          <div className="relative z-10 md:p-10">
            <DialogHeader className="mb-6 text-center">
              <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                {/* <Sparkles className="w-6 h-6 text-purple-500" /> */}
                Agent Preview - How you agent look like ?
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-[1300px] mx-auto">
              {/* LEFT: Larger Image Preview (7 columns) */}
              <div className="lg:col-span-7 flex justify-center items-center">
                <div className="relative group">
                  {/* <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-2xl blur opacity-75 transition duration-1000 group-hover:opacity-100"></div> */}
                  <div className="w-full relative border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-white dark:bg-zinc-900 shadow-2xl">
                    <Image
                      src={previewImage}
                      alt="Agent Preview"
                      width={800} // Increased width
                      height={500} // Increased height
                      className="rounded-xl object-contain w-full h-auto"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Details Panel (5 columns) */}
              <div className="lg:col-span-5 w-full">
                <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-6 text-purple-600 dark:text-purple-400">
                    <ClipboardList size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      Configuration
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <DetailItem label="Agent Name" value={formData?.name} />
                    <Separator className="opacity-50" />
                    <DetailItem
                      label="Description"
                      value={formData?.description}
                      isItalic
                    />
                    <Separator className="opacity-50" />
                    <DetailItem
                      label="Instruction"
                      value={formData?.instruction}
                      isItalic
                    />

                    <div className="pt-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm">
                        <Info size={16} className="text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          Associated Tool:{" "}
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {formData?.tool_id || "None"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 backdrop-blur-md mt-5">
                  <div className="space-y-5">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[400px] text-center sm:text-left">
                      Configure your agent and press Create button to save your
                      agent.
                    </p>

                    <div className="flex gap-4 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 sm:flex-none h-11 px-6 rounded-xl"
                      >
                        Back to Edit
                      </Button>
                      <Button
                        className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white h-11 px-10 rounded-xl shadow-lg shadow-purple-500/20"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Agent"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for clean list
function DetailItem({
  label,
  value,
  isItalic = false,
}: {
  label: string;
  value: string;
  isItalic?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-zinc-400 uppercase font-black tracking-tighter mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-medium leading-relaxed ${isItalic ? "italic text-zinc-600 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-100"}`}
      >
        {value || `No ${label} provided`}
      </p>
    </div>
  );
}
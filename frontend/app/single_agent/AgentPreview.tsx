"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sparkles, ClipboardList, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AgentPreviewModal() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  
  const [form, setForm] = useState({
    tenant_id: "",
    name: "",
    description: "",
    tool_id: "",
    instruction: "",
  });
  
  // State to hold the form data for the floating panel
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch data from localStorage that you saved in the previous form step
    const savedData = localStorage.getItem("agentForm");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  if (!mounted) return null;

  const previewImage = resolvedTheme === "dark" 
    ? "/photos/preview_dark.png" 
    : "/photos/preview_light.png";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* [&>button]:hidden removes the default Shadcn X button */}
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 [&>button]:hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-2xl font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Agent Preview
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Image Preview (8 columns) */}
            <div className="lg:col-span-8 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl blur opacity-75"></div>
                <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-white dark:bg-zinc-900 shadow-2xl">
                  <Image
                    src={previewImage}
                    alt="Agent Preview"
                    width={500}
                    height={300}
                    className="rounded-lg object-cover"
                    priority
                  />
                  
                  {/* FLOATING STATUS TAG ON IMAGE */}
                  <Badge className="absolute top-4 right-4 bg-emerald-500/90 text-white border-none backdrop-blur-md">
                    Live Preview
                  </Badge>
                </div>
              </div>
            </div>

            {/* RIGHT: Floating Details Container (4 columns) */}
            <div className="lg:col-span-4 relative">
              <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                  <ClipboardList size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Configuration</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Agent Name</p>
                    <p className="text-sm font-medium truncate">{formData?.name || "Unnamed Agent"}</p>
                  </div>
                  
                  <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                  
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Instruction / Role</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 italic">
                      "{formData?.instruction || "No instructions provided yet..."}"
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      <Info size={14} className="text-blue-500" />
                      <span className="text-[11px] font-medium italic">Tool ID: {formData?.tool_id || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[350px]">
              Review your configuration. Click <strong>Create</strong> to deploy this agent to the registry.
            </p>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
                Back to Edit
              </Button>
              <Button className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-8 shadow-lg shadow-purple-500/20">
                Create Agent
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { GitBranch, Sparkles } from "lucide-react";

export const IfElseNodeSettings = ({ selectedNode, updateFormData }: any) => {
  const [formData, setFormData] = useState({ ifCondition: "" });

  useEffect(() => {
    if (selectedNode?.data?.settings) {
      setFormData(selectedNode.data.settings);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!formData.ifCondition.trim()) {
      toast.error("Condition is required");
      return;
    }
    updateFormData(formData);
    toast.success("Logic updated");
  };

  return (
    <div className="flex flex-col h-full justify-between p-1">
      <div className="space-y-8">
        {/* Simple & Clean Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <h2 className="text-xl font-bold text-black tracking-tight">Logic</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em] ml-3.5">
            Conditional Branching
          </p>
        </div>

        {/* The "Classy" Card */}
        <div className="relative group">
          {/* Subtle background glow effect */}
          {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div> */}
          
          <div className="relative p-6 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                If Statement
              </Label>

            </div>

            <div className="relative">
              <Input
                placeholder='e.g. status === "active"'
                className="bg-slate-900/50 border-slate-800 rounded-xl h-12 focus:border-indigo-500/50 focus:ring-0 transition-all text-indigo-300 font-mono text-sm placeholder:text-slate-700"
                onChange={(e) => setFormData({ ...formData, ifCondition: e.target.value })}
                value={formData?.ifCondition || ""}
              />
            </div>

            {/* <p className="text-[10px] text-slate-600 leading-relaxed px-1">
              Write a JavaScript expression that evaluates to true or false.
            </p> */}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Button 
          className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all border border-indigo-400/20"
          onClick={handleSave}
        >
          Update Node
        </Button>
      </div>
    </div>
  );
};

export default IfElseNodeSettings;
"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Repeat } from "lucide-react";

export const LoopNodeSettings = ({ selectedNode, updateFormData }: any) => {
  const [formData, setFormData] = useState({ loopCount: "", iteratorName: "" });

  useEffect(() => {
    if (selectedNode?.data?.settings) {
      setFormData(selectedNode.data.settings);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!formData.loopCount) {
      toast.error("Iterations count is required");
      return;
    }
    updateFormData(formData);
    toast.success("Loop configuration updated");
  };

  return (
    <div className="flex flex-col h-full justify-between p-1">
      <div className="space-y-8">
        {/* Simple & Clean Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <h2 className="text-xl font-bold text-white tracking-tight">Loop</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em] ml-3.5">
            Iterative Execution
          </p>
        </div>

        {/* The "Classy" Card */}
        <div className="relative group">
          <div className="relative p-6 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl space-y-6">
            
            {/* Iteration Count Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Iterations
                </Label>
                <Repeat className="w-3.5 h-3.5 text-amber-400/50" />
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder='e.g. 10'
                  className="bg-slate-900/50 border-slate-800 rounded-xl h-12 focus:border-amber-500/50 focus:ring-0 transition-all text-amber-300 font-mono text-sm placeholder:text-slate-700"
                  onChange={(e) => setFormData({ ...formData, loopCount: e.target.value })}
                  value={formData?.loopCount || ""}
                />
              </div>
            </div>

            {/* Iterator Name Field */}
            <div className="space-y-3">
              <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Iterator Variable
              </Label>
              <Input
                placeholder='e.g. item'
                className="bg-slate-900/50 border-slate-800 rounded-xl h-12 focus:border-amber-500/50 focus:ring-0 transition-all text-slate-300 font-mono text-sm placeholder:text-slate-700"
                onChange={(e) => setFormData({ ...formData, iteratorName: e.target.value })}
                value={formData?.iteratorName || ""}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Button 
          className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all border border-amber-400/20"
          onClick={handleSave}
        >
          Update Loop
        </Button>
      </div>
    </div>
  );
};

export default LoopNodeSettings;
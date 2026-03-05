"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";

export const ApiNodeSettings = ({ selectedNode, updateFormData }: any) => {
  const [formData, setFormData] = useState({ 
    endpoint: "", 
    method: "GET" 
  });

  useEffect(() => {
    if (selectedNode?.data?.settings) {
      setFormData(selectedNode.data.settings);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!formData.endpoint.trim()) {
      toast.error("Endpoint URL is required");
      return;
    }
    updateFormData(formData);
    toast.success("API settings saved");
  };

  return (
    <div className="flex flex-col h-full justify-between p-1">
      <div className="space-y-8">
        {/* Simple & Clean Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <h2 className="text-xl font-bold text-white tracking-tight">API Request</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-[0.2em] ml-3.5">
            External Integration
          </p>
        </div>

        {/* The Configuration Card */}
        <div className="relative p-6 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl space-y-6">
          
          {/* Method and URL in a professional layout */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Method
              </Label>
              <Select 
                value={formData.method} 
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-800 rounded-xl focus:ring-0 text-emerald-400 font-bold">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Endpoint URL
                </Label>
                <Globe className="w-3 h-3 text-slate-600" />
              </div>
              <Input
                placeholder='https://api.example.com/data'
                className="bg-slate-900 border-slate-800 rounded-xl h-11 focus:border-emerald-500/50 focus:ring-0 transition-all text-slate-300 text-sm"
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                value={formData?.endpoint || ""}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6">
        <Button 
          className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all border border-emerald-400/20"
          onClick={handleSave}
        >
          Save API Config
        </Button>
      </div>
    </div>
  );
};

export default ApiNodeSettings;
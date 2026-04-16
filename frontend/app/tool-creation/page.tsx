"use client";
import React, { useState } from "react";
import { Settings, Eye, EyeOff, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { error } from "console";

export default function ToolRegistryPage() {
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tool_name: "",
    tool_api: "",
  });

  const handleSubmit = async () => {
    if (!formData.tool_name || !formData.tool_api) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: formData.tool_name,
          tool_api: formData.tool_api,
        }),
      });

      if (res.ok) {
        toast.success("Tool created successfully");
      } else if (res.status == 400) {
        toast.error("Tool already exists");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <form className="bg-white dark:bg-black border border-slate-200 dark:border-white/20 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
          <Settings
            size={18}
            className="text-indigo-600 dark:text-indigo-400"
          />
          <h2 className="font-semibold text-slate-800 dark:text-white">
            Add New Tool in Tool Registry
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Tool Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
              Tool Name
            </label>
            <input
              required
              type="text"
              placeholder="Gemini API"
              onChange={(e) =>
                setFormData({ ...formData, tool_name: e.target.value })
              }
              className="w-full bg-transparent border border-slate-200 dark:border-white/20 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                required
                type={showKey ? "text" : "password"}
                placeholder="API Key"
                onChange={(e) =>
                  setFormData({ ...formData, tool_api: e.target.value })
                }
                className="w-full bg-transparent border border-slate-200 dark:border-white/20 rounded-lg px-4 py-2.5 text-sm text-black dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Action */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-slate-200 dark:text-black text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <PlusCircle size={18} />
                Add Tool to Database
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

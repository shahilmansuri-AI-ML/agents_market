"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tenant } from "@/lib/tenant";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Settings, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
  });

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const data = await tenant.getCurrent();
      setFormData({
        name: data.name,
        description: data.description || "",
        domain: data.domain || "",
      });
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const tenantId = tenant.getCurrentTenantId();
      if (!tenantId) throw new Error("No tenant selected");
      
      await tenant.update(tenantId, formData);
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080B0F]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap');
        
        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;
          --border: rgba(255,255,255,0.06);
          --accent: #3B82F6;
          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
        }

        body { 
          font-family: 'Syne', sans-serif; 
          background: var(--bg); 
          color: var(--text-primary); 
        }

        .dashboard-root { 
          position: relative; 
          min-height: 100vh; 
          padding: 2rem; 
        }

        .grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />

        <div className="relative z-10">
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]/50" />
            <CardHeader className="border-b border-[var(--border)]">
              <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                <Settings className="w-5 h-5 text-[#3B82F6]" />
                Organization Settings
              </CardTitle>
              <CardDescription className="text-[var(--text-secondary)] font-medium">
                Manage your workspace configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-bold">Workspace Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme AI"
                  className="bg-[var(--surface-2)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-bold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does your organization do?"
                  rows={4}
                  className="bg-[var(--surface-2)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6] text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain" className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-bold">Custom Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="acme.ai"
                  className="bg-[var(--surface-2)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6] text-white"
                />
                <p className="text-xs italic text-[#3B82F6]/70 font-medium">
                  Custom domain for your workspace routing
                </p>
              </div>

              <div className="flex pt-2">
                <Button 
                  onClick={saveSettings} 
                  disabled={saving}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all active:scale-95"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
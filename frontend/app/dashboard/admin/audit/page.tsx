"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { FileText, Loader2, Search, Fingerprint, Globe, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  meta_data?: any;
  ip_address?: string;
  created_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.get("/audit/logs", { requireTenant: true });
      setLogs(data);
    } catch (error: any) {
      console.error("Audit logs error:", error);
      toast.error(error.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (action.includes("updated")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (action.includes("deleted")) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        
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

        code, .font-mono { font-family: 'DM Mono', monospace; }

        .log-row:hover {
          background-color: rgba(255, 255, 255, 0.015) !important;
        }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />

        <div className="relative z-10 space-y-8">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                System Surveillance
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium italic">
                Immutable audit trail of all workspace activities
              </p>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Filter logs by action or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[var(--surface)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6] text-sm"
              />
            </div>
          </div>

          {/* AUDIT LOGS TABLE */}
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]/30" />
            <CardHeader className="border-b border-[var(--border)] bg-white/[0.01]">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3B82F6]" />
                Event Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-[var(--border)] hover:bg-transparent">
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Operation</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Resource Entity</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Actor ID</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Network IP</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Execution Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-[var(--text-secondary)] italic">
                        No surveillance data matches your query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="border-[var(--border)] log-row transition-colors">
                        <TableCell>
                          <Badge className={`${getActionColor(log.action)} border font-semibold px-2 py-0.5 text-[10px] uppercase tracking-tighter`}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[var(--text-primary)]">
                          {log.resource}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                            <Fingerprint className="w-3 h-3 text-[#3B82F6]/40" />
                            {log.actor_id?.substring(0, 8) || "SYSTEM"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                            <Globe className="w-3 h-3 text-[#3B82F6]/40" />
                            {log.ip_address || "0.0.0.0"}
                          </div>
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            <Clock className="w-3 h-3 text-[#3B82F6]/40" />
                            {new Date(log.created_at).toLocaleString('en-IN', { 
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
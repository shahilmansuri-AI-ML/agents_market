"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Mail, Plus, Loader2, Copy, Send, Calendar, ShieldCheck } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role_id: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invitationsData, rolesData] = await Promise.all([
        api.get("/invitations", { requireTenant: true }),
        api.get("/roles", { requireTenant: true })
      ]);
      setInvitations(invitationsData);
      setRoles(rolesData);
    } catch (error: any) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    try {
      await api.post("/invitations", formData, { requireTenant: true });
      toast.success("Invitation sent successfully");
      setDialogOpen(false);
      setFormData({ email: "", role_id: "" });
      loadData();
    } catch (error: any) {
      toast.error("Failed to send invitation");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied");
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied");
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
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }

        .table-row-hover:hover {
          background-color: rgba(59, 130, 246, 0.03) !important;
          transition: background-color 0.2s ease;
        }

        code { font-family: 'DM Mono', monospace; }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />

        <div className="relative z-10 space-y-8">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Team Invitations
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium italic">
                Grow your workspace by inviting collaborators
              </p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.2)] px-6">
                  <Send className="w-4 h-4 mr-2" />
                  New Invitation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Invite Member</DialogTitle>
                  <DialogDescription className="text-[var(--text-secondary)]">
                    They will receive an email to join your tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Email Address</Label>
                    <Input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[var(--surface-2)] border-[var(--border)] focus:ring-1 focus:ring-[#3B82F6]" 
                      placeholder="colleague@company.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Assigned Role</Label>
                    <Select value={formData.role_id} onValueChange={(v) => setFormData({ ...formData, role_id: v })}>
                      <SelectTrigger className="bg-[var(--surface-2)] border-[var(--border)]">
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--surface-2)] border-[var(--border)] text-white">
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={sendInvitation} className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">
                    Send Secure Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* MAIN TABLE CARD */}
          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]/50" />
            <CardHeader className="border-b border-[var(--border)] bg-white/[0.01]">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#3B82F6]" />
                Active Invites
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-[var(--border)] hover:bg-transparent">
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Recipient</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Auth Token</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Expiry</TableHead>
                    <TableHead className="text-right text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-[var(--text-secondary)] italic">
                        No pending invitations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invitations.map((inv) => (
                      <TableRow key={inv.id} className="border-[var(--border)] table-row-hover">
                        <TableCell className="font-semibold text-[var(--text-primary)]">
                          {inv.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 group">
                            <code className="text-[11px] bg-[var(--surface-2)] text-[#3B82F6] px-2 py-1 rounded border border-[var(--border)]">
                              {inv.token.substring(0, 4)}••••{inv.token.substring(inv.token.length - 4)}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-secondary)] hover:text-white"
                              onClick={() => copyToken(inv.token)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            inv.status === "pending" 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }>
                            {inv.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {inv.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[#3B82F6] font-bold text-[10px] uppercase tracking-tighter"
                              onClick={() => copyInviteLink(inv.token)}
                            >
                              <Copy className="w-3 h-3 mr-2" />
                              Invite Link
                            </Button>
                          )}
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
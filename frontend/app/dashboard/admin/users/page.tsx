"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { superAdmin } from "@/lib/super-admin";
import { toast } from "sonner";
import { Users, Loader2, Shield, Ban, Trash2, Mail, UserCheck } from "lucide-react";

interface User {
  id: string;
  email: string;
  role_id?: string;
  role_name?: string;
  tenant_status?: string;
  is_verified: boolean;
  status: string;
  is_super_admin?: boolean;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const isUserSuperAdmin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('super_admin_email') !== null;
    }
    return false;
  };

  const loadData = async () => {
    try {
      const isSA = isUserSuperAdmin();
      const hasTenantContext = typeof window !== 'undefined' && localStorage.getItem('tenant_id') !== null;
      
      setIsSuperAdmin(isSA);
      
      if (hasTenantContext) {
        const [usersData, rolesData] = await Promise.all([
          api.get("/users", { requireTenant: true }),
          api.get("/roles", { requireTenant: true })
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } else if (isSA) {
        const [usersData, rolesData] = await Promise.all([
          superAdmin.getAllUsers(),
          superAdmin.getAllRoles()
        ]);
        
        const transformedUsers = usersData.map((user: any) => ({
          ...user,
          tenant_status: user.status,
          role_name: user.is_super_admin ? 'Super Admin' : 'No Role'
        }));
        setUsers(transformedUsers);
        setRoles(rolesData);
      } else {
        toast.error("No tenant context available");
        return;
      }
    } catch (error: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role_id: roleId }, { requireTenant: true });
      toast.success("User role updated");
      loadData();
    } catch (error: any) {
      toast.error("Failed to update role");
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await api.patch(`/users/${userId}/status`, { status }, { requireTenant: true });
      toast.success("User status updated");
      loadData();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    
    try {
      await api.delete(`/users/${userId}`, { requireTenant: true });
      toast.success("User removed");
      loadData();
    } catch (error: any) {
      toast.error("Failed to remove user");
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
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap');
 
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
          background-size: 45px 45px;
        }

        .user-row:hover {
          background-color: rgba(255, 255, 255, 0.01) !important;
        }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />

        <div className="relative z-10 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <Users className="w-8 h-8 text-[#3B82F6]" />
                Command Center: Users
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium italic">
                Manage identities, access levels, and account statuses
              </p>
            </div>
          </div>

          <Card className="bg-[var(--surface)] border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]/40" />
            
            <CardHeader className="border-b border-[var(--border)] bg-white/[0.01]">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#3B82F6]" />
                Personnel Directory
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-[var(--border)] hover:bg-transparent">
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">User Identity</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Security Role</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Status</TableHead>
                    <TableHead className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4">Verification</TableHead>
                    <TableHead className="text-right text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest py-4 px-6">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-[var(--border)] user-row transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-[#3B82F6]/50" />
                          <span className="font-medium text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role_id || undefined}
                          onValueChange={(roleId) => updateUserRole(user.id, roleId)}
                        >
                          <SelectTrigger className="w-[160px] bg-[var(--surface-2)] border-[var(--border)] h-8 text-xs font-semibold focus:ring-1 focus:ring-[#3B82F6]">
                            <SelectValue placeholder={user.role_name || "Select role"} />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--surface)] border-[var(--border)] text-white">
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id} className="text-xs focus:bg-[#3B82F6] focus:text-white">
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.tenant_status === "active" 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }>
                          {user.tenant_status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 ${user.is_verified ? "text-emerald-500" : "text-red-500/40"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {user.is_verified ? "Verified" : "Pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2 px-6">
                        {user.tenant_status === "active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider"
                            onClick={() => updateUserStatus(user.id, "suspended")}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider"
                            onClick={() => updateUserStatus(user.id, "active")}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider"
                          onClick={() => removeUser(user.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
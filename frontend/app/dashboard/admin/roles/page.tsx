"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge"; // Added for better UI
import { api } from "@/lib/api-client";
import { superAdmin } from "@/lib/super-admin";
import { toast } from "sonner";
import { Shield, Plus, Loader2, Edit, Trash2, Lock } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  tenant_id?: string;
  is_system?: boolean;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    permission_ids: [] as string[],
  });

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
        const [rolesData, permsData] = await Promise.all([
          api.get("/roles", { requireTenant: true }),
          api.get("/roles/permissions")
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
      } else if (isSA) {
        const [rolesData, permsData] = await Promise.all([
          superAdmin.getAllRoles(),
          superAdmin.getAllPermissions()
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
      } else {
        toast.error("No tenant context available");
        return;
      }
    } catch (error: any) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep existing handler functions: createRole, togglePermission, etc.)
  const createRole = async () => {
    try {
      await api.post("/roles", formData, { requireTenant: true });
      toast.success("Role created successfully");
      setDialogOpen(false);
      setFormData({ name: "", description: "", permission_ids: [] });
      loadData();
    } catch (error: any) {
      toast.error("Failed to create role");
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const toggleEditPermission = (permId: string) => {
    setEditFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    const permIds = permissions
      .filter(p => role.permissions?.includes(p.name))
      .map(p => p.id);
    setEditFormData({ permission_ids: permIds });
    setEditDialogOpen(true);
  };

  const updateRolePermissions = async () => {
    if (!editingRole) return;
    try {
      await api.patch(
        `/roles/${editingRole.id}/permissions`,
        editFormData.permission_ids,
        { requireTenant: true }
      );
      toast.success("Role permissions updated successfully");
      setEditDialogOpen(false);
      setEditingRole(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to update role permissions");
    }
  };

  const deleteRole = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      toast.error("Cannot delete system roles");
      return;
    }
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/roles/${roleId}`, { requireTenant: true });
      toast.success("Role deleted successfully");
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete role");
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;
          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(59,130,246,0.3);
          --accent: #3B82F6;
          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
        }
        body { font-family: 'Syne', sans-serif; background: var(--bg); color: var(--text-primary); }
        .dashboard-root { position: relative; min-height: 100vh; overflow: hidden; padding: 2rem; }
        .grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .glow-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.05), transparent 50%);
        }
      `}</style>

      <div className="dashboard-root">
        <div className="grid-overlay" />
        <div className="glow-bg" />

        {/* HEADER SECTION */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-8 mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Access Control
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
              Define roles and granular permissions for your organization
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold px-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Plus className="w-4 h-4 mr-2" />
                Create New Role
              </Button>
            </DialogTrigger>
            {/* Dialog contents also themed */}
            <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] max-w-2xl">
                {/* ... (Existing Dialog internal logic remains the same but styled) */}
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Create New Role</DialogTitle>
                  <DialogDescription className="text-[var(--text-secondary)]">Define a new role with specific permissions</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Role Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[var(--surface-2)] border-[var(--border)] focus:border-[#3B82F6]" placeholder="e.g. Architect" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Description</Label>
                    <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-[var(--surface-2)] border-[var(--border)] focus:border-[#3B82F6]" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Assign Permissions</Label>
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2">
                      {permissions.map((perm) => (
                        <div key={perm.id} className="flex items-start space-x-3 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                          <Checkbox checked={formData.permission_ids.includes(perm.id)} onCheckedChange={() => togglePermission(perm.id)} />
                          <div className="grid gap-1.5 leading-none">
                            <label className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{perm.name}</label>
                            <p className="text-[10px] text-[var(--text-secondary)]">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createRole} className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">Confirm Role Creation</Button>
                </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ROLES GRID */}
        <div className="relative z-10 grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="group bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {role.name}
                      {role.is_system && (
                        <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 text-[10px] px-2 py-0">
                          <Lock className="w-3 h-3 mr-1" /> SYSTEM
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[var(--text-secondary)] text-sm line-clamp-1 italic">
                      {role.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-secondary)] hover:text-[#3B82F6]" onClick={() => openEditDialog(role)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!role.is_system && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-secondary)] hover:text-red-500" onClick={() => deleteRole(role.id, !!role.is_system)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                     Active Permissions
                   </div>
                   <div className="flex flex-wrap gap-2">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((perm) => (
                        <span key={perm} className="px-2 py-1 text-[10px] font-medium rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] group-hover:text-[#3B82F6] group-hover:border-[#3B82F6]/30 transition-colors">
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-[var(--text-secondary)]">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Role Dialog (Themed same as create) */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Permissions - {editingRole?.name}</DialogTitle>
              <DialogDescription className="text-[var(--text-secondary)]">Adjust granular controls for this role.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                {permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <Checkbox checked={editFormData.permission_ids.includes(perm.id)} onCheckedChange={() => toggleEditPermission(perm.id)} />
                    <div className="grid gap-1 leading-none">
                      <label className="text-xs font-bold">{perm.name}</label>
                      <p className="text-[10px] text-[var(--text-secondary)]">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={updateRolePermissions} className="w-full bg-[#3B82F6] hover:bg-[#2563EB]">Update Role Access</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
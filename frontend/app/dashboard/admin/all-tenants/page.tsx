"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tenant } from "@/lib/tenant";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Building2, Crown, ArrowLeft, Users, Calendar, Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

export default function AllTenantsPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    domain: "",
    owner_email: "",
    owner_password: ""
  });
  
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    domain: "",
    status: ""
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const tenantsList = await tenant.getAllTenants();
      setTenants(tenantsList);
    } catch (error: any) {
      toast.error(error.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!createForm.name || !createForm.owner_email || !createForm.owner_password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await api.post("/api/super-admin/tenants", createForm);
      
      toast.success(response.message || "Tenant created successfully");
      setCreateDialogOpen(false);
      setCreateForm({
        name: "",
        description: "",
        domain: "",
        owner_email: "",
        owner_password: ""
      });
      loadTenants(); // Reload tenants list
    } catch (error: any) {
      toast.error(error.detail || "Failed to create tenant");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;

    setEditLoading(true);
    try {
      const response = await api.put(`/api/super-admin/tenants/${selectedTenant.id}`, editForm);
      
      toast.success("Tenant updated successfully");
      setEditDialogOpen(false);
      setSelectedTenant(null);
      loadTenants(); // Reload tenants list
    } catch (error: any) {
      toast.error(error.detail || "Failed to update tenant");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/super-admin/tenants/${selectedTenant.id}`);
      
      toast.success(response.message || "Tenant deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      loadTenants(); // Reload tenants list
    } catch (error: any) {
      toast.error(error.detail || "Failed to delete tenant");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (tenant: any) => {
    setSelectedTenant(tenant);
    setEditForm({
      name: tenant.name,
      description: tenant.description || "",
      domain: tenant.domain || "",
      status: tenant.status
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tenant: any) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="text-lg font-medium">Loading all tenants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
              <Crown className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Platform Administration
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Manage all tenants in the platform
              </p>
            </div>
          </div>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant and assign an owner. The owner credentials will be shown in the backend terminal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tenant Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter tenant name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Enter tenant description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={createForm.domain}
                  onChange={(e) => setCreateForm({...createForm, domain: e.target.value})}
                  placeholder="Enter domain (optional)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner_email">Owner Email *</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={createForm.owner_email}
                  onChange={(e) => setCreateForm({...createForm, owner_email: e.target.value})}
                  placeholder="owner@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner_password">Owner Password *</Label>
                <Input
                  id="owner_password"
                  type="password"
                  value={createForm.owner_password}
                  onChange={(e) => setCreateForm({...createForm, owner_password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTenant} disabled={createLoading}>
                {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {tenants.length}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {tenants.filter(t => t.status === 'active').length}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Active Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {tenants.filter(t => {
                    const createdDate = new Date(t.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return createdDate >= thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">New (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Grid */}
      {tenants.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              No tenants found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              There are no tenants in the system yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenantItem) => (
            <Card 
              key={tenantItem.id} 
              className="hover:shadow-lg transition-shadow border-zinc-200 dark:border-zinc-800"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <Badge 
                    variant={tenantItem.status === 'active' ? 'default' : 'secondary'}
                    className={
                      tenantItem.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                    }
                  >
                    {tenantItem.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tenantItem.name}</CardTitle>
                {tenantItem.description && (
                  <CardDescription className="line-clamp-2">
                    {tenantItem.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {tenantItem.domain && (
                    <div>
                      <span className="font-medium">Domain:</span> {tenantItem.domain}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span> {new Date(tenantItem.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {tenantItem.id.substring(0, 8)}...
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => {
                        // Set tenant and redirect
                        localStorage.setItem("tenant_id", tenantItem.id);
                        localStorage.setItem("tenant_name", tenantItem.name);
                        toast.success(`Switched to ${tenantItem.name}`);
                        window.location.href = "/dashboard";
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Access
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(tenantItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDeleteDialog(tenantItem)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update the tenant information. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tenant Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Enter tenant name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Enter tenant description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-domain">Domain</Label>
              <Input
                id="edit-domain"
                value={editForm.domain}
                onChange={(e) => setEditForm({...editForm, domain: e.target.value})}
                placeholder="Enter domain"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTenant} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTenant && (
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTenant.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedTenant.description}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">ID: {selectedTenant.id}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTenant} 
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

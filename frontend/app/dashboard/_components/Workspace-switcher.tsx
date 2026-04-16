"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tenant, Tenant } from "@/lib/tenant";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [currentTenantName, setCurrentTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
    const tenantId = tenant.getCurrentTenantId();
    const tenantName = tenant.getCurrentTenantName();
    setCurrentTenantId(tenantId);
    setCurrentTenantName(tenantName);
  }, []);

  useEffect(() => {
    // Update current tenant when it changes
    const currentId = tenant.getCurrentTenantId();
    setCurrentTenantId(currentId);
  }, []);

  useEffect(() => {
    // Update current tenant name when it changes
    const currentName = tenant.getCurrentTenantName();
    setCurrentTenantName(currentName);
  }, []);

  const loadTenants = async () => {
    try {
      // Check if user is super admin
      const isSuperAdmin = typeof window !== 'undefined' && 
        localStorage.getItem('super_admin_email') !== null;
      
      let data;
      if (isSuperAdmin) {
        data = await tenant.getAllTenants();
      } else {
        data = await tenant.getMyTenants();
      }
      setTenants(data);
    } catch (error) {
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = (t: Tenant) => {
    tenant.setCurrentTenant(t.id, t.name);
    setCurrentTenantId(t.id);
    setCurrentTenantName(t.name);
    toast.success(`Switched to ${t.name}`);
    router.refresh();
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId);
  
  // Check if user is super admin
  const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('super_admin_email') !== null;
  
  // Use tenant name from state (localStorage) if tenant object not found yet
  // For super admin without tenant selection, show "Super Admin Dashboard"
  let displayName = currentTenant?.name || currentTenantName;
  
  if (!displayName) {
    displayName = isSuperAdmin ? "Super Admin Dashboard" : "Select Workspace";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
              {displayName?.charAt(0).toUpperCase() || "W"}
            </div>
            <span className="truncate">
              {displayName}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => switchTenant(t)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                {t.name?.charAt(0).toUpperCase() || "W"}
              </div>
              <div>
                <div className="font-medium">{t.name}</div>
                {t.user_role && (
                  <div className="text-xs text-zinc-500">{t.user_role}</div>
                )}
              </div>
            </div>
            {t.id === currentTenantId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/workspace/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
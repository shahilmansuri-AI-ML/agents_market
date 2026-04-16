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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
    setCurrentTenantId(tenant.getCurrentTenantId());
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenant.getMyTenants();
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
    toast.success(`Switched to ${t.name}`);
    router.refresh();
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentTenant?.name || "Select Workspace"}
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
              <Building2 className="h-4 w-4" />
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

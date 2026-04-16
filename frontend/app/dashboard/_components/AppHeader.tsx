"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  User,
  Shield,
  ChevronDown,
  Check,
  Sun,
  Moon,
  CircleUserRound,
  Settings,
  LogOut,
  UserCog,
  Building2,
  BarChart3,
  Lock,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "./Workspace-switcher";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  is_system?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  user_role: string;
  user_role_id: string;
}

interface ProfileStats {
  agents_created: number;
  api_calls_this_month: number;
}

interface AppHeaderProps {
  userEmail: string;
  tenantName: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ userEmail, tenantName }) => {
  const { theme, setTheme } = useTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [originalRole, setOriginalRole] = useState<Role | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    loadTenants();
    loadRoleData();
    loadUserTenants();
    loadProfileStats();
    loadProfile();
  }, []);

  const loadRoleData = async () => {
    try {
      // Check if user is super admin
      const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('super_admin_email') !== null;
      setIsAdmin(isSuperAdmin);

      console.log("🔍 AppHeader - Loading role data:", {
        isSuperAdmin,
        localStorage_role_id: localStorage.getItem('user_role_id'),
        localStorage_role_name: localStorage.getItem('user_role_name'),
        localStorage_original_role: localStorage.getItem('user_original_role'),
        tenant_id: localStorage.getItem('tenant_id')
      });

      if (isSuperAdmin) {
        // Super admin - check if they have a tenant selected for role switching
        const hasTenantContext = typeof window !== 'undefined' && localStorage.getItem('tenant_id') !== null;
        const userRoleId = localStorage.getItem('user_role_id');
        const userRoleName = localStorage.getItem('user_role_name');
        const originalRoleName = localStorage.getItem('user_original_role');
        
        // Set Super Admin as the original role
        if (!originalRoleName) {
          setOriginalRole({
            id: 'super-admin',
            name: 'Super Admin',
            description: 'Platform administrator with full access',
            permissions: ['*'],
            is_system: true
          });
        }
        
        // If super admin is viewing as a different role
        if (userRoleName && userRoleName !== 'Super Admin') {
          setCurrentRole({
            id: userRoleId || 'unknown',
            name: userRoleName,
            description: `${userRoleName} role`,
            permissions: [],
          });
          
          setOriginalRole({
            id: 'super-admin',
            name: 'Super Admin',
            description: 'Platform administrator with full access',
            permissions: ['*'],
            is_system: true
          });
        } else {
          // Show Super Admin as current role
          setCurrentRole({
            id: 'super-admin',
            name: 'Super Admin',
            description: 'Platform administrator with full access',
            permissions: ['*'],
            is_system: true
          });
          
          setOriginalRole({
            id: 'super-admin',
            name: 'Super Admin',
            description: 'Platform administrator with full access',
            permissions: ['*'],
            is_system: true
          });
        }
        
        // Load roles from selected tenant if available
        if (hasTenantContext) {
          try {
            const roles = await api.get("/roles", { requireTenant: true });
            setAvailableRoles(roles);
            
            // Update current role with full details if viewing as different role
            if (userRoleId && userRoleName !== 'Super Admin') {
              const role = roles.find((r: Role) => r.id === userRoleId);
              if (role) setCurrentRole(role);
            }
          } catch (apiError) {
            console.error("❌ Failed to fetch roles from API:", apiError);
          }
        } else {
          // No tenant context - load all roles for reference
          const roles = await api.get("/roles", { requireTenant: false });
          setAvailableRoles(roles);
        }
      } else {
        // Regular user - fetch their assigned role from tenant context
        const hasTenantContext = typeof window !== 'undefined' && localStorage.getItem('tenant_id') !== null;
        const userRoleId = localStorage.getItem('user_role_id');
        const userRoleName = localStorage.getItem('user_role_name');
        const storedOriginalRole = localStorage.getItem('user_original_role');
        
        if (hasTenantContext) {
          try {
            const roles = await api.get("/roles", { requireTenant: true });
            console.log("✅ Fetched roles from API:", roles);
            setAvailableRoles(roles);
            
            // Set current role with full details from API
            if (userRoleId) {
              const role = roles.find((r: Role) => r.id === userRoleId);
              console.log("🎯 Matched role:", role);
              if (role) {
                setCurrentRole(role);
              }
            } else if (userRoleName) {
              // Fallback: try to find by name if ID is missing
              const role = roles.find((r: Role) => r.name === userRoleName);
              console.log("🎯 Matched role by name:", role);
              if (role) {
                setCurrentRole(role);
              }
            }
            
            // Only set originalRole if user has actually switched roles
            if (storedOriginalRole && storedOriginalRole !== userRoleName) {
              const originalRoleObj = roles.find((r: Role) => r.name === storedOriginalRole);
              if (originalRoleObj) setOriginalRole(originalRoleObj);
            }
          } catch (apiError) {
            console.error("❌ Failed to fetch roles from API:", apiError);
            // Fallback: set basic role from localStorage if API fails
            if (userRoleName) {
              setCurrentRole({
                id: userRoleId || 'unknown',
                name: userRoleName,
                description: `${userRoleName} role`,
                permissions: [],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load role data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const data = await api.get("/tenants/my-tenants", { requireTenant: false });
      setTenants(data);
      
      const storedTenantId = localStorage.getItem("tenant_id");
      if (storedTenantId) {
        const tenant = data.find((t: Tenant) => t.id === storedTenantId);
        setCurrentTenant(tenant || null);
      }
    } catch (error) {
      console.error("Failed to load tenants:", error);
    }
  };

  const loadUserTenants = async () => {
    try {
      const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem('super_admin_email') !== null;
      if (isSuperAdmin) return; // Super admin doesn't need tenant switcher

      const tenants = await api.get("/tenants/my-tenants", { requireTenant: false });
      setUserTenants(tenants);
      
      const currentTenant = localStorage.getItem('tenant_id');
      setCurrentTenantId(currentTenant);
    } catch (error) {
      console.error("Failed to load user tenants:", error);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await api.get("/roles", { requireAuth: true });
      setRoles(data);
      
      const storedRoleId = localStorage.getItem("role_id");
      if (storedRoleId) {
        const role = data.find((r: Role) => r.id === storedRoleId);
        setCurrentRole(role || null);
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  };

  const loadProfileStats = async () => {
    try {
      const data = await api.get("/profile/stats", { requireAuth: true });
      setProfileStats({
        agents_created: data.agents_created || 0,
        api_calls_this_month: data.api_calls_this_month || 0
      });
    } catch (error) {
      console.error("Failed to load profile stats:", error);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await api.get("/profile/me", { requireAuth: true });
      setFullName(data.full_name || "");
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const getRoleAccessLevel = (role: Role | null) => {
    if (!role) return "No Role";
    if (role.name === "Owner" || role.name === "Admin") return "Full Tenant Access";
    if (role.name === "Member") return "Standard Access";
    if (role.name === "AI Developer") return "Developer Access";
    if (role.name === "AI Ops") return "Operations Access";
    return "Custom Access";
  };

  const getRoleHierarchy = (roleName: string): number => {
    // Define role hierarchy (higher number = higher privilege)
    const hierarchy: { [key: string]: number } = {
      "Owner": 5,
      "Admin": 4,
      "AI Developer": 3,
      "AI Ops": 3,
      "Member": 2,
    };
    return hierarchy[roleName] || 1;
  };

  const canSwitchRoles = () => {
    // Allow switching if current or original role is Owner, Admin, or Super Admin
    const roleToCheck = originalRole || currentRole;
    return roleToCheck?.name === "Owner" || roleToCheck?.name === "Admin" || isAdmin;
  };

  const getAvailableRolesToSwitchTo = () => {
    // Use originalRole if set (user has switched), otherwise use currentRole
    const baseRole = originalRole || currentRole;
    console.log("🔄 Role Switcher Debug:", {
      baseRole: baseRole?.name,
      currentRole: currentRole?.name,
      originalRole: originalRole?.name,
      availableRoles: availableRoles.map(r => r.name),
      isAdmin,
      canSwitch: canSwitchRoles()
    });
    
    if (!baseRole) return [];
    
    // Super admin can switch to any role
    if (isAdmin) {
      // If viewing as a different role, include Super Admin in the list
      if (isViewingAsDifferentRole()) {
        return [
          {
            id: 'super-admin',
            name: 'Super Admin',
            description: 'Platform administrator with full access',
            permissions: ['*'],
            is_system: true
          },
          ...availableRoles
        ];
      }
      return availableRoles;
    }
    
    const baseRoleLevel = getRoleHierarchy(baseRole.name);
    
    // Filter roles: can only switch to roles at same level or lower
    // Exclude the current role from the list
    const filtered = availableRoles.filter(role => {
      const roleLevel = getRoleHierarchy(role.name);
      return roleLevel <= baseRoleLevel && role.name !== currentRole?.name;
    });
    
    console.log("🎯 Filtered roles for switching:", filtered.map(r => r.name));
    return filtered;
  };

  const isViewingAsDifferentRole = () => {
    // Only viewing as different role if originalRole exists AND is different from currentRole
    if (!originalRole) return false;
    return currentRole?.name !== originalRole?.name;
  };

  const handleSwitchBackToSuperAdmin = () => {
    try {
      // Clear role-specific localStorage items
      localStorage.removeItem('user_role_id');
      localStorage.removeItem('user_role_name');
      localStorage.removeItem('user_original_role');
      localStorage.removeItem('user_permissions');
      
      toast.success("Switched back to Super Admin");
      
      // Reload to apply Super Admin context
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch back to Super Admin:", error);
      toast.error("Failed to switch back to Super Admin");
    }
  };

  const handleRoleSwitch = async (roleId: string) => {
    try {
      // Check if switching back to Super Admin
      if (roleId === 'super-admin') {
        handleSwitchBackToSuperAdmin();
        return;
      }

      const role = availableRoles.find((r) => r.id === roleId);
      if (!role) return;

      // If this is the first time switching roles, store the current role as original
      if (!localStorage.getItem('user_original_role') && currentRole) {
        localStorage.setItem('user_original_role', currentRole.name);
      }

      // Store the new role in localStorage
      localStorage.setItem('user_role_id', role.id);
      localStorage.setItem('user_role_name', role.name);
      
      setCurrentRole(role);
      toast.success(`Switched to ${role.name} role`);
      
      // Reload the page to apply new permissions
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch role:", error);
      toast.error("Failed to switch role");
    }
  };

  const handleTenantSwitch = async (tenant: Tenant) => {
    try {
      // Clear permissions cache before switching
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_original_role'); // Clear original role when switching tenants
      
      // Store the new tenant and role in localStorage
      localStorage.setItem('tenant_id', tenant.id);
      localStorage.setItem('tenant_name', tenant.name);
      localStorage.setItem('user_role_id', tenant.user_role_id);
      localStorage.setItem('user_role_name', tenant.user_role);
      
      toast.success(`Switched to ${tenant.name}`);
      
      // Reload the page to apply new tenant context and permissions
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch tenant:", error);
      toast.error("Failed to switch tenant");
    }
  };

  return (
    <>
      {/* ✅ THEME + FONT */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --bg: #080B0F;
          --surface: #0D1117;
          --surface-2: #161B22;

          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);

          --accent: #3B82F6;
          --accent-hover: #2563EB;

          --text-primary: #F0F6FC;
          --text-secondary: #7D8590;
        }

        body {
          background: var(--bg);
          font-family: 'Syne', sans-serif;
        }

        .header-theme {
          background: var(--surface);
          border-color: var(--border);
        }
      `}</style>
    <header className="header-theme sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b px-6">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-[var(--text-secondary)] hover:bg-[var(--surface-2)]" />
        {isAdmin ? (
          <>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Workspace :
            </span>
            <WorkspaceSwitcher />
          </>
        ) : userTenants.length > 1 ? (
          <>
            <Separator orientation="vertical" className="h-4" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {tenantName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs text-zinc-500">
                  Switch Workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userTenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.id}
                    onClick={() => handleTenantSwitch(tenant)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{tenant.name}</span>
                        <span className="text-xs text-zinc-500">{tenant.user_role}</span>
                      </div>
                      {currentTenantId === tenant.id && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {tenantName}
            </span>
          </>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2">
        {/* Role & Permissions Display */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8 px-3 rounded-full border border-zinc-200 dark:border-zinc-800"
            >
              {isAdmin ? (
                <UserCog className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="text-xs font-medium">
                {loading ? "Loading..." : (
                  <>
                    {currentRole?.name || "No Role"}
                    {isViewingAsDifferentRole() && (
                      <span className="ml-1 text-[10px] text-amber-600">(viewing)</span>
                    )}
                  </>
                )}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 rounded-xl shadow-lg"
          >
            <DropdownMenuLabel className="text-xs text-zinc-500">
              Current Role
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Show current role info for all users */}
            <div className="px-2 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{currentRole?.name || "No Role Assigned"}</span>
                {currentRole?.is_system && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    System
                  </span>
                )}
                {isViewingAsDifferentRole() && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Viewing As
                  </span>
                )}
              </div>
              {isViewingAsDifferentRole() && (
                <div className="text-[10px] text-zinc-500 mb-2">
                  Your actual role: <span className="font-medium text-indigo-600">{originalRole?.name}</span>
                </div>
              )}
              {currentRole?.description && (
                <p className="text-[10px] text-zinc-500 mb-2">{currentRole.description}</p>
              )}
              {!isAdmin && (
                <>
                  <div className="text-[10px] text-zinc-500 mb-1">Access Level:</div>
                  <div className="text-xs font-medium text-indigo-600">{getRoleAccessLevel(currentRole)}</div>
                </>
              )}
              {currentRole?.permissions && currentRole.permissions.length > 0 && currentRole.permissions[0] !== '*' && (
                <>
                  <div className="text-[10px] text-zinc-500 mt-2 mb-1">Permissions ({currentRole.permissions.length}):</div>
                  <div className="flex flex-wrap gap-1">
                    {currentRole.permissions.slice(0, 6).map((perm) => (
                      <span key={perm} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {perm}
                      </span>
                    ))}
                    {currentRole.permissions.length > 6 && (
                      <span className="text-[9px] px-1.5 py-0.5 text-zinc-500">
                        +{currentRole.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </>
              )}
              {isAdmin && (
                <div className="text-[10px] text-indigo-600 mt-2">
                  ✓ Full platform access
                </div>
              )}
            </div>
            
            {/* Role Switcher for Owner/Admin */}
            {canSwitchRoles() && getAvailableRolesToSwitchTo().length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-zinc-500">
                  {isViewingAsDifferentRole() ? "Switch Back or View As" : "View As Different Role"}
                </DropdownMenuLabel>
                <div className="px-2 py-1 max-h-48 overflow-y-auto">
                  {getAvailableRolesToSwitchTo().map((role) => (
                    <DropdownMenuItem
                      key={role.id}
                      onClick={() => handleRoleSwitch(role.id)}
                      className="cursor-pointer text-xs py-2"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{role.name}</span>
                        {currentRole?.id === role.id && (
                          <Check className="w-3 h-3 text-indigo-600" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator
          orientation="vertical"
          className="mx-2 hidden h-6 md:block"
        />

        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button> */}

          <div className="w-[1.5px] h-6 bg-zinc-300 dark:bg-zinc-700 mx-2 hidden md:block" />

          {/* User Profile - Switched to DropdownMenu (Shadcn standard for User Menus) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0"
              >
                <CircleUserRound className="h-5 w-5 text-[var(--text-secondary)]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
            >
              <div className="flex items-center gap-3 bg-zinc-50/50 p-3 dark:bg-zinc-900/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                  <User size={16} className="text-indigo-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <DropdownMenuLabel className="p-0 text-sm font-bold truncate">
                    {fullName || tenantName}
                  </DropdownMenuLabel>
                  <span className="text-[11px] text-zinc-500 truncate">
                    {userEmail}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {tenantName}
                  </span>
                </div>
              </div>

              {profileStats && (
                <>
                  <div className="px-3 py-2 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-600 dark:text-zinc-400">📊 {profileStats.agents_created} Agents</span>
                      <span className="text-zinc-600 dark:text-zinc-400">• {profileStats.api_calls_this_month} Calls</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="m-0" />
                </>
              )}

              <div className="p-1">
                {!isAdmin && (
                  <Link href="/dashboard/profile">
                    <DropdownMenuItem className="gap-2 px-3 py-2 text-xs cursor-pointer">
                      <Settings size={14} />
                      Profile Settings
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/dashboard/profile/security">
                  <DropdownMenuItem className="gap-2 px-3 py-2 text-xs cursor-pointer">
                    <Lock size={14} />
                    Security
                  </DropdownMenuItem>
                </Link>
                {!isAdmin && (
                  <Link href="/dashboard/profile/overview">
                    <DropdownMenuItem className="gap-2 px-3 py-2 text-xs cursor-pointer">
                      <BarChart3 size={14} />
                      Account Overview
                    </DropdownMenuItem>
                  </Link>
                )}
              </div>

              <DropdownMenuSeparator className="m-0" />

              <div className="p-1">
                <Link href="/login">
                  <DropdownMenuItem className="gap-2 px-3 py-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/10 cursor-pointer">
                    <LogOut size={14} />
                    Log out
                  </DropdownMenuItem>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    </>
  );
};

import { api } from "./api-client";

export type Permission =
  | "tenant.manage"
  | "users.create"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "roles.assign"
  | "roles.manage"
  | "audit.view"
  | "api_keys.create"
  | "api_keys.delete"
  | "agents.create"
  | "agents.read"
  | "agents.update"
  | "agents.delete"
  | "tools.manage"
  | "workflow.create"
  | "workflow.execute"
  | "workflow.delete"
  | "invitations.send"
  | "invitations.manage";

export interface Role {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  permissions?: string[];
}

export interface PermissionItem {
  id: string;
  name: string;
  description?: string;
}

let cachedPermissions: string[] | null = null;

const isClient = typeof window !== 'undefined';

export const permissions = {
  async fetchUserPermissions(): Promise<string[]> {
    try {
      // Get user's role ID from localStorage (set during login)
      const userRoleId = isClient ? localStorage.getItem('user_role_id') : null;
      
      if (!userRoleId) {
        console.warn("No user role ID found in localStorage");
        return [];
      }
      
      // Fetch all roles from the tenant
      const roles = await api.get<Role[]>("/roles", { requireTenant: true });
      
      // Find the user's specific role
      const userRole = roles.find(role => role.id === userRoleId);
      
      if (!userRole) {
        console.warn("User's role not found in tenant roles");
        return [];
      }
      
      // Get permissions from user's role
      const perms = userRole.permissions || [];
      cachedPermissions = perms;
      
      if (isClient) {
        localStorage.setItem("user_permissions", JSON.stringify(perms));
      }
      
      console.log("Fetched permissions for role:", userRole.name, perms);
      
      return perms;
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
      return [];
    }
  },

  getUserPermissions(): string[] {
    if (cachedPermissions) {
      return cachedPermissions;
    }

    if (!isClient) {
      return [];
    }

    const stored = localStorage.getItem("user_permissions");
    if (stored) {
      try {
        cachedPermissions = JSON.parse(stored);
        return cachedPermissions || [];
      } catch {
        return [];
      }
    }

    return [];
  },

  canAccess(permission: Permission): boolean {
    // Super admin has all permissions ONLY if not viewing as another role
    const isSuperAdmin = isClient && localStorage.getItem('super_admin_email') !== null;
    const isViewingAsRole = isClient && localStorage.getItem('user_role_name') && localStorage.getItem('user_role_name') !== 'Super Admin';
    
    if (isSuperAdmin && !isViewingAsRole) {
      return true;
    }
    
    const userPermissions = this.getUserPermissions();
    return userPermissions.includes(permission);
  },

  hasAnyPermission(perms: Permission[]): boolean {
    // Super admin has all permissions ONLY if not viewing as another role
    const isSuperAdmin = isClient && localStorage.getItem('super_admin_email') !== null;
    const isViewingAsRole = isClient && localStorage.getItem('user_role_name') && localStorage.getItem('user_role_name') !== 'Super Admin';
    
    if (isSuperAdmin && !isViewingAsRole) {
      return true;
    }
    
    const userPermissions = this.getUserPermissions();
    return perms.some(perm => userPermissions.includes(perm));
  },

  hasAllPermissions(perms: Permission[]): boolean {
    // Super admin has all permissions ONLY if not viewing as another role
    const isSuperAdmin = isClient && localStorage.getItem('super_admin_email') !== null;
    const isViewingAsRole = isClient && localStorage.getItem('user_role_name') && localStorage.getItem('user_role_name') !== 'Super Admin';
    
    if (isSuperAdmin && !isViewingAsRole) {
      return true;
    }
    
    const userPermissions = this.getUserPermissions();
    return perms.every(perm => userPermissions.includes(perm));
  },

  getUserRole(): string | null {
    if (!isClient) return null;
    return localStorage.getItem('user_role_name');
  },

  isOwner(): boolean {
    // Super admin is owner ONLY if not viewing as another role
    const isSuperAdmin = isClient && localStorage.getItem('super_admin_email') !== null;
    const isViewingAsRole = isClient && localStorage.getItem('user_role_name') && localStorage.getItem('user_role_name') !== 'Super Admin';
    
    if (isSuperAdmin && !isViewingAsRole) {
      return true;
    }
    return this.getUserRole()?.toLowerCase() === 'owner';
  },

  isAdmin(): boolean {
    // Super admin is admin ONLY if not viewing as another role
    const isSuperAdmin = isClient && localStorage.getItem('super_admin_email') !== null;
    const isViewingAsRole = isClient && localStorage.getItem('user_role_name') && localStorage.getItem('user_role_name') !== 'Super Admin';
    
    if (isSuperAdmin && !isViewingAsRole) {
      return true;
    }
    const role = this.getUserRole()?.toLowerCase();
    return role === 'admin' || role === 'owner';
  },

  isSuperAdmin(): boolean {
    return isClient && localStorage.getItem('super_admin_email') !== null;
  },

  clearCache() {
    cachedPermissions = null;
    if (isClient) {
      localStorage.removeItem("user_permissions");
    }
  },
};

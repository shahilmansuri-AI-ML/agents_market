import { api } from "./api-client";

export interface SuperAdminUser {
  id: string;
  email: string;
  is_verified: boolean;
  is_super_admin: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminRole {
  id: string;
  name: string;
  description?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminPermission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export const superAdmin = {
  async getAllUsers(): Promise<SuperAdminUser[]> {
    return api.get("/api/super-admin/users");
  },

  async getAllRoles(): Promise<SuperAdminRole[]> {
    return api.get("/api/super-admin/roles");
  },

  async getAllPermissions(): Promise<SuperAdminPermission[]> {
    return api.get("/api/super-admin/permissions");
  },
};

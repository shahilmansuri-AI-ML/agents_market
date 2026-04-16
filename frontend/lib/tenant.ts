import { api } from "./api-client";

const isClient = typeof window !== 'undefined';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  status: string;
  created_at: string;
  user_role?: string;
  user_status?: string;
}

export const tenant = {
  async create(data: { name: string; description?: string; domain?: string }) {
    return api.post<Tenant>("/tenants", data);
  },

  async getMyTenants(): Promise<Tenant[]> {
    return api.get("/tenants/my-tenants");
  },

  async getAllTenants(): Promise<Tenant[]> {
    // Check if user is super admin and use super admin routes
    if (typeof window !== 'undefined' && localStorage.getItem('super_admin_email')) {
      return api.get("/api/super-admin/tenants");
    }
    return api.get("/tenants/all-tenants");
  },

  async getCurrent() {
    return api.get<Tenant>("/tenants/current", { requireTenant: true });
  },

  async update(tenantId: string, data: Partial<Tenant>) {
    return api.patch<Tenant>(`/tenants/${tenantId}`, data, { requireTenant: true });
  },

  setCurrentTenant(tenantId: string, tenantName: string) {
    if (isClient) {
      localStorage.setItem("tenant_id", tenantId);
      localStorage.setItem("tenant_name", tenantName);
    }
  },

  getCurrentTenantId(): string | null {
    return isClient ? localStorage.getItem("tenant_id") : null;
  },

  getCurrentTenantName(): string | null {
    return isClient ? localStorage.getItem("tenant_name") : null;
  },

  clearCurrentTenant() {
    if (isClient) {
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("tenant_name");
    }
  },
};

import { api } from "./api-client";

const isClient = typeof window !== 'undefined';

export interface User {
  id: string;
  email: string;
  is_verified: boolean;
  is_super_admin: boolean;
  status: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  is_verified: boolean;
  tenant_id?: string;
  tenant_name?: string;
  role_id?: string;
  role_name?: string;
}

export const auth = {
  async signup(email: string, password: string) {
    return api.post("/auth/signup", { email, password }, { requireAuth: false });
  },

  async verifyOTP(email: string, otp: string) {
    const response = await api.post<LoginResponse>(
      "/auth/verify-otp", 
      { email, otp }, 
      { requireAuth: false }
    );

    // Clear localStorage before storing new data
    if (response.access_token && isClient) {
      localStorage.clear();
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("user_email", response.email);
      
      // Store role information if available
      if (response.role_id) {
        localStorage.setItem("user_role_id", response.role_id);
      }
      if (response.role_name) {
        localStorage.setItem("user_role_name", response.role_name);
      }
    }

    return response;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      "/auth/login",
      { email, password },
      { requireAuth: false }
    );

    if (isClient) {
      // Clear all localStorage before storing new login data
      localStorage.clear();
      
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      localStorage.setItem("user_email", response.email);
      
      console.log("🔍 Login response data:", {
        has_tenant_id: !!response.tenant_id,
        has_tenant_name: !!response.tenant_name,
        tenant_id: response.tenant_id,
        tenant_name: response.tenant_name,
        response_keys: Object.keys(response)
      });
      
      // Store tenant_id and tenant_name if available
      if (response.tenant_id) {
        localStorage.setItem("tenant_id", response.tenant_id);
        console.log("✅ Stored tenant_id:", response.tenant_id);
      }
      if (response.tenant_name) {
        localStorage.setItem("tenant_name", response.tenant_name);
        console.log("✅ Stored tenant_name:", response.tenant_name);
      } else {
        console.warn("⚠️ tenant_name not in response!");
      }
      
      // Store role information if available
      if (response.role_id) {
        localStorage.setItem("user_role_id", response.role_id);
        console.log("✅ Stored user_role_id:", response.role_id);
      }
      if (response.role_name) {
        localStorage.setItem("user_role_name", response.role_name);
        console.log("✅ Stored user_role_name:", response.role_name);
      }
      
      console.log("📦 Login response:", { 
        tenant_id: response.tenant_id,
        tenant_name: response.tenant_name,
        role_id: response.role_id, 
        role_name: response.role_name,
        stored_tenant_id: localStorage.getItem("tenant_id"),
        stored_tenant_name: localStorage.getItem("tenant_name"),
        stored_role_id: localStorage.getItem("user_role_id"),
        stored_role_name: localStorage.getItem("user_role_name")
      });
    }

    return response;
  },

  async refreshToken() {
    if (!isClient) {
      throw new Error("Cannot refresh token on server");
    }
    
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post<{ access_token: string }>(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { requireAuth: false }
    );

    localStorage.setItem("access_token", response.access_token);
    return response;
  },

  logout() {
    if (isClient) {
      // Clear all localStorage on logout
      localStorage.clear();
    }
  },

  isAuthenticated(): boolean {
    return isClient ? !!localStorage.getItem("access_token") : false;
  },

  getToken(): string | null {
    return isClient ? localStorage.getItem("access_token") : null;
  },

  getUserEmail(): string | null {
    return isClient ? localStorage.getItem("user_email") : null;
  },
};

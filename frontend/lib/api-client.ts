const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const isClient = typeof window !== 'undefined';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
  requireTenant?: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requireAuth = true, requireTenant = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (requireAuth && isClient) {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (requireTenant && isClient) {
    const tenantId = localStorage.getItem("tenant_id");
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }
  }

  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }

      throw new ApiError(
        response.status,
        errorData.detail || "An error occurred",
        errorData
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Network error occurred");
  }
}

// Convenience methods
export const api = {
  get: <T = any>(path: string, options?: ApiOptions) =>
    apiClient<T>(path, { ...options, method: "GET" }),

  post: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiClient<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(path: string, options?: ApiOptions) =>
    apiClient<T>(path, { ...options, method: "DELETE" }),
};
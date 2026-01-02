const API_URL = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: number;
  email: string;
  role: string;
  name: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }

    return data;
  }

  async register(email: string, password: string, metadata?: { name?: string }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: metadata?.name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const data = await this.request<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      this.removeToken();
      return null;
    }
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
}

export interface ServiceRequest {
  id?: number;
  service: string;
  scheduledDate: string;
  scheduledEndDate?: string;
  scheduledTime: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  area?: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export const api = new ApiClient();

// Auth API extensions
export const authApi = {
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },
};

// Admin Users API
export interface AdminUser {
  id: number;
  email: string;
  role: string;
  name: string | null;
  language: string;
  created_at: string;
}

export const usersApi = {
  async getAll(): Promise<AdminUser[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async create(email: string, password: string, name?: string): Promise<{ success: boolean; user: AdminUser; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ email, password, name }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async delete(userId: number): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async changeUserPassword(userId: number, newPassword: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ newPassword }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async sendPasswordReset(userId: number): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users/${userId}/send-reset`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },
};

// Service Requests API
export const serviceRequestsApi = {
  async create(data: ServiceRequest): Promise<ServiceRequest & { message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getMyRequests(): Promise<ServiceRequest[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/service-requests`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async getAllRequests(): Promise<ServiceRequest[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/service-requests`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },

  async updateStatus(id: number, status: string): Promise<{ success: boolean }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/service-requests/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  },
};

export type { User, AuthResponse };

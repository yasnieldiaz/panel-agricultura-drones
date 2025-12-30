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

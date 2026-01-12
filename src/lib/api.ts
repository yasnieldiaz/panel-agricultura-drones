import { cache, CACHE_KEYS } from './cache'

const API_URL = import.meta.env.VITE_API_URL || 'https://cieniowanie.droneagri.pl/api';

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

  async register(email: string, password: string, metadata?: { name?: string; phone?: string; language?: string }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name: metadata?.name,
        phone: metadata?.phone,
        language: metadata?.language
      }),
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
      // Cache the user data
      cache.set(CACHE_KEYS.USER, data.user);
      return data.user;
    } catch (error) {
      // If offline, try to get from cache
      if (!navigator.onLine) {
        const cachedUser = cache.get<User>(CACHE_KEYS.USER);
        if (cachedUser) return cachedUser;
      }
      this.removeToken();
      return null;
    }
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  // Profile methods
  async getProfile(): Promise<UserProfile> {
    const data = await this.request<{ profile: UserProfile }>('/profile');
    return data.profile;
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ success: boolean; profile: UserProfile }> {
    const data = await this.request<{ success: boolean; message: string; profile: UserProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return { success: data.success, profile: data.profile };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  language: string;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  company_name: string | null;
  tax_id: string | null;
  created_at: string;
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

  async getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.profile;
  },

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ success: boolean; profile: UserProfile }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(profileData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return { success: result.success, profile: result.profile };
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
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // Cache the results
      cache.set(CACHE_KEYS.USERS, result);
      return result;
    } catch (error) {
      // If offline, return cached data
      if (!navigator.onLine) {
        const cached = cache.get<AdminUser[]>(CACHE_KEYS.USERS);
        if (cached) return cached;
      }
      throw error;
    }
  },

  async create(email: string, password: string, name?: string, role: 'user' | 'admin' = 'user'): Promise<{ success: boolean; user: AdminUser; message: string }> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ email, password, name, role }),
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
    try {
      const response = await fetch(`${API_URL}/service-requests`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // Cache the results
      cache.set(CACHE_KEYS.SERVICE_REQUESTS, result);
      return result;
    } catch (error) {
      // If offline, return cached data
      if (!navigator.onLine) {
        const cached = cache.get<ServiceRequest[]>(CACHE_KEYS.SERVICE_REQUESTS);
        if (cached) return cached;
      }
      throw error;
    }
  },

  async getAllRequests(): Promise<ServiceRequest[]> {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_URL}/admin/service-requests`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // Cache the results
      cache.set(CACHE_KEYS.ALL_SERVICE_REQUESTS, result);
      return result;
    } catch (error) {
      // If offline, return cached data
      if (!navigator.onLine) {
        const cached = cache.get<ServiceRequest[]>(CACHE_KEYS.ALL_SERVICE_REQUESTS);
        if (cached) return cached;
      }
      throw error;
    }
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

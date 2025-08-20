import { apiRequest } from '@/lib/api-config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessName?: string;
  businessType?: 'PRODUCTS' | 'RESERVATIONS' | 'CONSULTATION';
  plan?: 'STARTER' | 'PRO' | 'BUSINESS';
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'CLIENT' | 'END_USER';
  businesses?: any[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Stocker le token
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async register(data: RegisterRequest): Promise<{ user: AuthUser; message: string }> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Supprimer le cookie auth-token côté serveur
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getRedirectPath(user: AuthUser): string {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'CLIENT':
        return '/restaurant/home';
      default:
        return '/';
    }
  }
};
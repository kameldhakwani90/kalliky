import { apiRequest } from '@/lib/api-config';

export interface AdminClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
  period: 'MONTHLY' | 'YEARLY';
  paymentType: 'STRIPE_AUTO' | 'MANUAL';
  status: 'active' | 'inactive' | 'trial';
  isActive: boolean;
  autoRenew: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  nextBillingDate?: string;
  totalRevenue: number;
  storesCount: number;
  lastLogin?: string;
  stripeCustomerId?: string;
  createdAt: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  plan?: 'STARTER' | 'PRO' | 'BUSINESS';
  period?: 'MONTHLY' | 'YEARLY';
  paymentType?: 'STRIPE_AUTO' | 'MANUAL';
  isActive?: boolean;
  autoRenew?: boolean;
}

export const adminClientsService = {
  async getAll(filters?: {
    search?: string;
    plan?: string;
    status?: string;
  }): Promise<AdminClient[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.plan) params.append('plan', filters.plan);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<AdminClient[]>(`/admin/clients${query}`);
  },

  async create(data: CreateClientRequest): Promise<{ message: string; client: AdminClient }> {
    return apiRequest('/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getById(id: string): Promise<AdminClient> {
    return apiRequest<AdminClient>(`/admin/clients/${id}`);
  },

  async activate(id: string, activate: boolean, endDate?: string, notes?: string): Promise<any> {
    return apiRequest(`/admin/clients/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ activate, endDate, notes }),
    });
  },

  async getStats(): Promise<{
    totalClients: number;
    activeClients: number;
    trialClients: number;
    totalRevenue: number;
  }> {
    const clients = await this.getAll();
    
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.isActive).length,
      trialClients: clients.filter(c => c.status === 'trial').length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0)
    };
  }
};
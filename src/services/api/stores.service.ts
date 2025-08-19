import { apiRequest } from '@/lib/api-config';

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  currency: string;
  taxRate?: number;
  createdAt?: string;
  updatedAt?: string;
  businessId: string;
}

export const storesService = {
  async getAll(): Promise<Store[]> {
    return apiRequest<Store[]>('/stores');
  },

  async getById(id: string): Promise<Store> {
    return apiRequest<Store>(`/stores/${id}`);
  },

  async create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    return apiRequest<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Store>): Promise<Store> {
    return apiRequest<Store>(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/stores/${id}`, {
      method: 'DELETE',
    });
  },
};
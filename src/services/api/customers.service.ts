import { apiRequest } from '@/lib/api-config';

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  status: 'new' | 'regular' | 'vip';
  avgBasket?: number;
  totalSpent?: number;
  firstSeen?: string;
  lastSeen?: string;
  orderCount?: number;
  businessId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
}

export const customersService = {
  async getAll(businessId?: string): Promise<Customer[]> {
    const query = businessId ? `?businessId=${businessId}` : '';
    return apiRequest<Customer[]>(`/customers${query}`);
  },

  async getById(id: string): Promise<Customer> {
    return apiRequest<Customer>(`/customers/${id}`);
  },

  async getByPhone(phone: string): Promise<Customer | null> {
    return apiRequest<Customer | null>(`/customers/phone/${phone}`);
  },

  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiRequest<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getStats(businessId?: string): Promise<CustomerStats> {
    const query = businessId ? `?businessId=${businessId}` : '';
    return apiRequest<CustomerStats>(`/customers/stats${query}`);
  },
};
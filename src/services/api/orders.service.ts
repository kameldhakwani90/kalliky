import { apiRequest } from '@/lib/api-config';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  basePrice: number;
  customizations?: {
    type: 'add' | 'remove';
    name: string;
    price?: number;
  }[];
  finalPrice: number;
}

export interface Order {
  id: string;
  customerPhone: string;
  customerId?: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersToday: number;
  revenueToday: number;
}

export const ordersService = {
  async getAll(filters?: {
    storeId?: string;
    customerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Order[]>(`/orders${query}`);
  },

  async getById(id: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}`);
  },

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getStats(storeId?: string): Promise<OrderStats> {
    const query = storeId ? `?storeId=${storeId}` : '';
    return apiRequest<OrderStats>(`/orders/stats${query}`);
  },

  async getRecent(limit: number = 10, storeId?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (storeId) params.append('storeId', storeId);
    return apiRequest<Order[]>(`/orders/recent?${params.toString()}`);
  },
};
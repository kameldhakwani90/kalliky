import { apiRequest } from '@/lib/api-config';

export interface DashboardStats {
  revenue: {
    total: number;
    growth: number;
    period: 'day' | 'week' | 'month';
  };
  orders: {
    total: number;
    growth: number;
  };
  avgBasket: {
    value: number;
    growth: number;
  };
  customers: {
    unique: number;
    growth: number;
  };
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
}

export interface RevenueChartData {
  monthly: ChartData[];
  weekly: ChartData[];
  daily: ChartData[];
}

export const dashboardService = {
  async getStats(businessId?: string): Promise<DashboardStats> {
    const query = businessId ? `?businessId=${businessId}` : '';
    return apiRequest<DashboardStats>(`/dashboard/stats${query}`);
  },

  async getRevenueChart(
    period: 'month' | 'week' | 'day' = 'month',
    businessId?: string
  ): Promise<ChartData[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (businessId) params.append('businessId', businessId);
    return apiRequest<ChartData[]>(`/dashboard/revenue-chart?${params.toString()}`);
  },

  async getActivityFeed(limit: number = 20, businessId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (businessId) params.append('businessId', businessId);
    return apiRequest<any[]>(`/dashboard/activity?${params.toString()}`);
  },
};
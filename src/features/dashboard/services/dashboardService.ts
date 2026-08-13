import { apiClient } from '@/lib/http/apiClient';

export interface DashboardSummaryResponse {
  users: { total: number; active: number };
  candidates: { total: number; active: number };
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
    return data;
  },
};

import { apiClient } from '@/lib/http/apiClient';
export interface DashboardSummaryResponse {
  users?: { total: number; active: number };
  candidates: { 
    total: number; 
    active: number;
    inProgress: number;
    completed: number;
    underReview: number;
    approved: number;
    rejected: number;
    archived: number;
  };
  recentActivity?: any[]; 
  recentCandidates?: any[];
}

function excludeSystemUser(summary: DashboardSummaryResponse): DashboardSummaryResponse {
  if (!summary.users) {
    return summary;
  }

  return {
    ...summary,
    users: {
      total: Math.max(0, summary.users.total - 1),
      active: Math.max(0, summary.users.active - 1),
    },
  };
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
    return excludeSystemUser(data);
  },
  
};

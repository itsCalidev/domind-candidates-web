import { apiClient } from '@/lib/http/apiClient';
import type { CandidateStatus } from '@/features/candidates/types/candidate.types';

export interface DashboardCandidateCounts {
  total: number;
  active: number;
  inProgress: number;
  completed: number;
  underReview: number;
  approved: number;
  rejected: number;
  archived: number;
}

export interface DashboardRecentCandidate {
  id: string;
  folio: string;
  companyName: string;
  status: CandidateStatus;
  personal?: { firstName: string; lastName: string };
}

export interface DashboardActivityUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DashboardActivityEntry {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  user: DashboardActivityUser;
  candidate: { id: string; folio: string } | null;
}

export interface DashboardSummaryResponse {
  users?: { total: number; active: number };
  candidates: DashboardCandidateCounts;
  recentCandidates?: DashboardRecentCandidate[];
  recentActivity?: DashboardActivityEntry[];
}

function excludeSystemUser(summary: DashboardSummaryResponse): DashboardSummaryResponse {
  if (!summary.users) return summary;
  
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
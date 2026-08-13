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
  /** Código crudo del backend (ej. 'ASSIGN_CANDIDATE'). Se traduce solo en la UI. */
  action: string;
  details?: string;
  createdAt: string;
  user: DashboardActivityUser;
  candidate: { id: string; folio: string } | null;
}

export interface DashboardSummaryResponse {
  /** Ausente cuando el usuario autenticado es RECRUITER — el backend simplemente no lo envía. */
  users?: { total: number; active: number };
  candidates: DashboardCandidateCounts;
  recentCandidates?: DashboardRecentCandidate[];
  recentActivity?: DashboardActivityEntry[];
}

export const dashboardService = {
  /**
   * El backend ya excluye a SYSTEM del conteo de usuarios operativos y
   * ya escala/filtra toda la respuesta según el rol del usuario
   * autenticado (RECRUITER recibe candidates/recentActivity ya
   * limitados a lo suyo, y sin `users` en absoluto). El frontend
   * consume la respuesta tal cual, sin ninguna compensación local.
   */
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
    return data;
  },
};

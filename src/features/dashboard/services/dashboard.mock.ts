import { CANDIDATE_STATUS_LABEL, type CandidateStatus } from '@/features/candidates/types/candidate.types';
import type { ActivityItem, AlertItem, CandidatesByStatusPoint } from '../types/dashboard.types';

/**
 * Datos simulados del Dashboard que TODAVÍA no tienen endpoint real
 * confirmado (candidatos por estado, actividad reciente, alertas).
 * `getSummaryMetrics` fue removido de aquí — ese dato ya es real, ver
 * dashboardService.ts.
 *
 * IMPORTANTE: `getCandidatesByStatus` y `getRecentActivity` usan el
 * enum/labels REALES de Candidates (CANDIDATE_STATUS_LABEL) y fechas
 * ISO reales — cuando exista el campo real en GET /dashboard/summary,
 * solo cambia la fuente de datos, no la forma que ya consumen los
 * componentes.
 */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const MOCK_STATUS_COUNTS: Record<CandidateStatus, number> = {
  IN_PROGRESS: 24,
  UNDER_REVIEW: 11,
  COMPLETED: 9,
  APPROVED: 39,
  REJECTED: 4,
  ARCHIVED: 0,
};

export const dashboardMock = {
  async getCandidatesByStatus(): Promise<CandidatesByStatusPoint[]> {
    return (Object.keys(MOCK_STATUS_COUNTS) as CandidateStatus[]).map((status) => ({
      status: CANDIDATE_STATUS_LABEL[status],
      total: MOCK_STATUS_COUNTS[status],
    }));
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    return [
      { id: '1', actor: 'María López', action: 'inició su solicitud.', timestamp: minutesAgo(5) },
      { id: '2', actor: 'Juan Pérez', action: 'terminó el cuestionario.', timestamp: minutesAgo(18) },
      {
        id: '3',
        actor: 'Carlos Hernández',
        action: 'subió su comprobante de domicilio.',
        timestamp: minutesAgo(35),
      },
      { id: '4', actor: 'Administrador', action: 'creó un nuevo usuario.', timestamp: minutesAgo(60) },
    ];
  },

  async getAlerts(): Promise<AlertItem[]> {
    return [
      { id: '1', message: '4 expedientes llevan más de 7 días sin revisar.', severity: 'warning' },
      { id: '2', message: '2 candidatos no han subido documentos.', severity: 'warning' },
      { id: '3', message: '1 usuario fue deshabilitado hoy.', severity: 'info' },
    ];
  },
};

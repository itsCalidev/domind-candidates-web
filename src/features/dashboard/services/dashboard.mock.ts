import type { AlertItem } from '../types/dashboard.types';

/**
 * Único dato del Dashboard que sigue en mock: no existe todavía un
 * endpoint real para alertas. `getSummaryMetrics`, `getCandidatesByStatus`
 * y `getRecentActivity` fueron eliminados de aquí — ahora vienen 100%
 * de GET /dashboard/summary (ver dashboardService.ts / useDashboardData.ts).
 */
export const dashboardMock = {
  async getAlerts(): Promise<AlertItem[]> {
    return [
      { id: '1', message: '4 expedientes llevan más de 7 días sin revisar.', severity: 'warning' },
      { id: '2', message: '2 candidatos no han subido documentos.', severity: 'warning' },
      { id: '3', message: '1 usuario fue deshabilitado hoy.', severity: 'info' },
    ];
  },
};

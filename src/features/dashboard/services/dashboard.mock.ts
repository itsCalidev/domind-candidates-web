import type {
  ActivityItem,
  AlertItem,
  CandidatesByStatusPoint,
  SummaryMetric,
} from '../types/dashboard.types';

/**
 * Datos simulados del Dashboard.
 *
 * Cada función simula el endpoint que eventualmente la reemplazará
 * (ej. `dashboardService.getSummary()` → GET /dashboard/summary),
 * para que `DashboardPage` no tenga que cambiar su forma de consumir
 * estos datos cuando conectemos el backend real.
 */
export const dashboardMock = {
  async getSummaryMetrics(): Promise<SummaryMetric[]> {
    return [
      { id: 'new', label: 'Candidatos nuevos', value: 8, delta: '+3 hoy', icon: 'new', accentColor: '#0083C1' },
      { id: 'inProgress', label: 'En proceso', value: 24, delta: '+5 esta semana', icon: 'inProgress', accentColor: '#67B1E3' },
      { id: 'review', label: 'Bajo revisión', value: 11, delta: '4 con más de 7 días', icon: 'review', accentColor: '#F39200' },
      { id: 'approved', label: 'Aprobados', value: 39, delta: '+9 este mes', icon: 'approved', accentColor: '#76B82A' },
    ];
  },

  async getCandidatesByStatus(): Promise<CandidatesByStatusPoint[]> {
    return [
      { status: 'Pendientes', total: 14 },
      { status: 'En revisión', total: 11 },
      { status: 'En proceso', total: 24 },
      { status: 'Completos', total: 39 },
    ];
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    return [
      { id: '1', actor: 'María López', action: 'inició su solicitud.', timestamp: 'Hace 5 min' },
      { id: '2', actor: 'Juan Pérez', action: 'terminó el cuestionario.', timestamp: 'Hace 18 min' },
      { id: '3', actor: 'Carlos Hernández', action: 'subió su comprobante de domicilio.', timestamp: 'Hace 35 min' },
      { id: '4', actor: 'Administrador', action: 'creó un nuevo usuario.', timestamp: 'Hace 1 hora' },
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

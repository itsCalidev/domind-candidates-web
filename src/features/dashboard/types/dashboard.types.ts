export interface SummaryMetric {
  id: string;
  label: string;
  value: number;
  delta?: string;
  icon: 'new' | 'inProgress' | 'review' | 'approved';
  accentColor: string;
}

export interface CandidatesByStatusPoint {
  status: string;
  total: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  /**
   * Id del usuario que realizó la acción. Permite mostrar "Tú" en vez
   * del nombre cuando coincide con el usuario autenticado (ver
   * RecentActivity.tsx). Opcional porque el mock actual no tiene un id
   * de usuario real que comparar contra una sesión — se activa solo
   * cuando el backend real lo incluya.
   */
  actorId?: string;
  action: string;
  /** ISO 8601. Se formatea a texto relativo en el componente, nunca aquí. */
  timestamp: string;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

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
  /** Nombre completo del actor (para iniciales del avatar) — en la oración solo se muestra el primer nombre. */
  actor: string;
  /**
   * Id del usuario que realizó la acción. Permite mostrar "Tú" en vez
   * del nombre cuando coincide con el usuario autenticado.
   */
  actorId?: string;
  /** Código crudo del backend (ej. 'ASSIGN_CANDIDATE'). Se traduce a texto en RecentActivity.tsx. */
  action: string;
  /** Dato adicional del backend (ej. "Status: COMPLETED"), usado para enriquecer la traducción. */
  details?: string;
  /** Folio del candidato afectado, si aplica (ej. 'CAND-0001'). */
  candidateFolio?: string;
  /** ISO 8601. Se formatea a texto relativo en el componente, nunca aquí. */
  timestamp: string;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

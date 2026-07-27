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
  action: string;
  timestamp: string;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
}

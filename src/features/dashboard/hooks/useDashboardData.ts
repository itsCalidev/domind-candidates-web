import { useEffect, useState } from 'react';
import { dashboardMock } from '../services/dashboard.mock';
import type {
  ActivityItem,
  AlertItem,
  CandidatesByStatusPoint,
  SummaryMetric,
} from '../types/dashboard.types';

interface DashboardData {
  summaryMetrics: SummaryMetric[];
  candidatesByStatus: CandidatesByStatusPoint[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
}

/**
 * Centraliza la carga de datos del Dashboard.
 *
 * Hoy llama a `dashboardMock`; cuando exista `GET /dashboard/summary` en
 * el backend, solo se reemplaza la fuente de datos aquí — la página no
 * necesita cambiar su forma de consumir `data`/`isLoading`.
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [summaryMetrics, candidatesByStatus, recentActivity, alerts] = await Promise.all([
        dashboardMock.getSummaryMetrics(),
        dashboardMock.getCandidatesByStatus(),
        dashboardMock.getRecentActivity(),
        dashboardMock.getAlerts(),
      ]);

      if (isMounted) {
        setData({ summaryMetrics, candidatesByStatus, recentActivity, alerts });
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading };
}

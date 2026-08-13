import { useEffect, useState } from 'react';
import { dashboardMock } from '../services/dashboard.mock';
import { dashboardService, type DashboardSummaryResponse } from '../services/dashboardService';
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

function buildSummaryMetrics(summary: DashboardSummaryResponse): SummaryMetric[] {
  const metrics: SummaryMetric[] = [];

  if (summary.users) {
    metrics.push(
      {
        id: 'usersTotal',
        label: 'Total de usuarios',
        value: summary.users.total,
        icon: 'new',
        accentColor: '#0083C1',
      },
      {
        id: 'usersActive',
        label: 'Usuarios activos',
        value: summary.users.active,
        icon: 'approved',
        accentColor: '#76B82A',
      }
    );
  }

  metrics.push(
    {
      id: 'candidatesTotal',
      label: 'Total de candidatos',
      value: summary.candidates.total,
      icon: 'review',
      accentColor: '#67B1E3',
    },
    {
      id: 'candidatesActive',
      label: 'Candidatos activos',
      value: summary.candidates.active,
      icon: 'inProgress',
      accentColor: '#F39200',
    }
  );

  return metrics;
}
function buildCandidatesByStatus(summary: DashboardSummaryResponse): CandidatesByStatusPoint[] {
  return [
    { status: 'En Proceso', total: summary.candidates.inProgress },
    { status: 'En Revisión', total: summary.candidates.underReview },
    { status: 'Completado', total: summary.candidates.completed },
    { status: 'Aprobado', total: summary.candidates.approved },
    { status: 'Rechazado', total: summary.candidates.rejected },
    { status: 'Archivado', total: summary.candidates.archived },
  ];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [summary, recentActivity, alerts] = await Promise.all([
          dashboardService.getSummary(),
          dashboardMock.getRecentActivity(),
          dashboardMock.getAlerts(),
        ]);

        if (isMounted) {
          setData({
            summaryMetrics: buildSummaryMetrics(summary),
            candidatesByStatus: buildCandidatesByStatus(summary),
            recentActivity,
            alerts,
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error al obtener el resumen del dashboard:', error);
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, isError };
}

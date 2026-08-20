import { useEffect, useState } from 'react';
import { dashboardMock } from '../services/dashboard.mock';
import { dashboardService, type DashboardSummaryResponse } from '../services/dashboardService';
import { CANDIDATE_STATUS_LABEL } from '@/features/candidates/types/candidate.types';
import type {
  ActivityItem,
  AlertItem,
  CandidatesByStatusPoint,
  SummaryMetric,
} from '../types/dashboard.types';

interface DashboardData {
  /** Cards para SYSTEM/ADMIN (usuarios + candidatos globales). Vacío de usuarios si `summary.users` no vino. */
  summaryMetrics: SummaryMetric[];
  /** Cards para RECRUITER: desglose de SUS candidatos, ya escalado por el backend. */
  recruiterMetrics: SummaryMetric[];
  candidatesByStatus: CandidatesByStatusPoint[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
}

function buildSummaryMetrics(summary: DashboardSummaryResponse): SummaryMetric[] {
  const metrics: SummaryMetric[] = [];

  // `users` está ausente cuando el usuario autenticado es RECRUITER —
  // el backend simplemente no lo envía en ese caso.
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
      },
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
    },
  );

  return metrics;
}

function buildRecruiterMetrics(summary: DashboardSummaryResponse): SummaryMetric[] {
  const c = summary.candidates;
  return [
    { id: 'myTotal', label: 'Mis candidatos', value: c.total, icon: 'new', accentColor: '#0083C1' },
    { id: 'myActive', label: 'Activos', value: c.active, icon: 'approved', accentColor: '#76B82A' },
    { id: 'myInProgress', label: 'En evaluación', value: c.inProgress, icon: 'inProgress', accentColor: '#67B1E3' },
    { id: 'myUnderReview', label: 'En revisión', value: c.underReview, icon: 'review', accentColor: '#69478E' },
    { id: 'myApproved', label: 'Recomendados', value: c.approved, icon: 'approved', accentColor: '#76B82A' },
    { id: 'myCompleted', label: 'Completados', value: c.completed, icon: 'approved', accentColor: '#F39200' },
    { id: 'myRejected', label: 'No recomendados', value: c.rejected, icon: 'review', accentColor: '#D32F2F' },
  ];
}

/**
 * Reutiliza CANDIDATE_STATUS_LABEL (la misma fuente de verdad que ya
 * usa Candidates) en vez de duplicar las traducciones con strings
 * nuevos — evita que la gráfica y el resto de la app terminen
 * mostrando textos ligeramente distintos para el mismo estado.
 */
function buildCandidatesByStatus(summary: DashboardSummaryResponse): CandidatesByStatusPoint[] {
  const c = summary.candidates;
  return [
    { status: CANDIDATE_STATUS_LABEL.IN_EVALUATION, total: c.inProgress },
    { status: CANDIDATE_STATUS_LABEL.UNDER_REVIEW, total: c.underReview },
    { status: CANDIDATE_STATUS_LABEL.COMPLETED, total: c.completed },
    { status: CANDIDATE_STATUS_LABEL.RECOMMENDED, total: c.approved },
    { status: CANDIDATE_STATUS_LABEL.NOT_RECOMMENDED, total: c.rejected },
    { status: CANDIDATE_STATUS_LABEL.ARCHIVED, total: c.archived },
  ];
}

function buildRecentActivity(summary: DashboardSummaryResponse): ActivityItem[] {
  return (summary.recentActivity ?? []).map((entry) => ({
    id: entry.id,
    actor: `${entry.user.firstName} ${entry.user.lastName}`.trim(),
    actorId: entry.user.id,
    action: entry.action,
    details: entry.details,
    candidateFolio: entry.candidate?.folio,
    timestamp: entry.createdAt,
  }));
}

/**
 * summaryMetrics, recruiterMetrics, candidatesByStatus y recentActivity
 * ahora vienen 100% de GET /dashboard/summary — el backend ya
 * escala/filtra por rol, así que este hook no necesita conocer el rol
 * del usuario (eso lo decide DashboardPage al elegir qué mostrar).
 * Solo `alerts` sigue en mock: no existe endpoint real para eso todavía.
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [summary, alerts] = await Promise.all([
          dashboardService.getSummary(),
          dashboardMock.getAlerts(),
        ]);

        if (isMounted) {
          setData({
            summaryMetrics: buildSummaryMetrics(summary),
            recruiterMetrics: buildRecruiterMetrics(summary),
            candidatesByStatus: buildCandidatesByStatus(summary),
            recentActivity: buildRecentActivity(summary),
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

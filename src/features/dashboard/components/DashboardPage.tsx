import { Alert, Box, Grid, Skeleton, Typography } from '@mui/material';
import { useDashboardData } from '../hooks/useDashboardData';
import { SummaryCard } from './SummaryCard';
import { CandidatesStatusChart } from './CandidatesStatusChart';
import { RecentActivity } from './RecentActivity';
import { AlertsPanel } from './AlertsPanel';
import { QuickActions } from './QuickActions';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasFullAccess } from '@/features/auth/types/role.enum';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardData();
  const { user } = useAuth();
  const isFullAccess = hasFullAccess(user?.role);

  const metrics = isFullAccess ? data?.summaryMetrics : data?.recruiterMetrics;
  const metricsCount = isFullAccess ? 4 : 7;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Hola, {user?.email.split('@')[0]}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {isFullAccess ? 'Este es el resumen del sistema hoy.' : 'Este es el resumen de tu trabajo hoy.'}
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          No se pudieron cargar las métricas del Dashboard. Verifica tu conexión e intenta de nuevo.
        </Alert>
      )}

      {/* Resumen: SYSTEM/ADMIN ven usuarios+candidatos globales;
          RECRUITER ve el desglose de SUS candidatos — ambos ya vienen
          escalados por rol desde el mismo GET /dashboard/summary. */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {isLoading || !metrics
          ? Array.from({ length: metricsCount }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : metrics.map((metric, index) => (
              <Grid key={metric.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryCard metric={metric} delayMs={index * 60} />
              </Grid>
            ))}
      </Grid>

      {/* Gráfica (ya viene escalada a "mis candidatos" para RECRUITER)
          + Alertas (solo SYSTEM/ADMIN — sigue siendo mock e información
          de tipo administrativo, no personal). */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: isFullAccess ? 8 : 12 }}>
          {isLoading || !data ? (
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          ) : (
            <CandidatesStatusChart data={data.candidatesByStatus} />
          )}
        </Grid>
        {isFullAccess && (
          <Grid size={{ xs: 12, lg: 4 }}>
            {isLoading || !data ? (
              <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
            ) : (
              <AlertsPanel alerts={data.alerts} />
            )}
          </Grid>
        )}
      </Grid>

      {/* Actividad reciente (el backend ya la limita a la propia del
          RECRUITER, sin cambios de este lado) + Acciones rápidas. */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {isLoading || !data ? (
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
          ) : (
            <RecentActivity items={data.recentActivity} />
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <QuickActions />
        </Grid>
      </Grid>
    </Box>
  );
}

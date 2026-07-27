import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { useDashboardData } from '../hooks/useDashboardData';
import { SummaryCard } from './SummaryCard';
import { CandidatesStatusChart } from './CandidatesStatusChart';
import { RecentActivity } from './RecentActivity';
import { AlertsPanel } from './AlertsPanel';
import { QuickActions } from './QuickActions';
import { useAuth } from '@/features/auth/context/AuthContext';

export function DashboardPage() {
  const { data, isLoading } = useDashboardData();
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Hola, {user?.email.split('@')[0]}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este es el resumen del sistema hoy.
      </Typography>

      {/* Resumen general */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {isLoading || !data
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : data.summaryMetrics.map((metric, index) => (
              <Grid key={metric.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryCard metric={metric} delayMs={index * 60} />
              </Grid>
            ))}
      </Grid>

      {/* Gráfica + Alertas */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {isLoading || !data ? (
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          ) : (
            <CandidatesStatusChart data={data.candidatesByStatus} />
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          {isLoading || !data ? (
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          ) : (
            <AlertsPanel alerts={data.alerts} />
          )}
        </Grid>
      </Grid>

      {/* Actividad reciente + Acciones rápidas */}
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

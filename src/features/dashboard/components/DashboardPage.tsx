import { Alert, Box, Grid, Skeleton, Typography } from '@mui/material';
import { useDashboardData } from '../hooks/useDashboardData';
import { SummaryCard } from './SummaryCard';
import { CandidatesStatusChart } from './CandidatesStatusChart';
import { RecentActivity } from './RecentActivity';
import { AlertsPanel } from './AlertsPanel';
import { QuickActions } from './QuickActions';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasFullAccess } from '@/features/auth/types/role.enum';

/**
 * Toggle temporal pedido por el usuario para ocultar la tarjeta de
 * Alertas sin borrar el componente ni sus datos — cambiar a `true` la
 * vuelve a mostrar. `boolean` (no el literal `false` inline en el JSX):
 * TypeScript elimina como código muerto una rama de `&&` cuyo operando
 * izquierdo es el tipo literal `false`, y dentro de código que marca
 * inalcanzable deja de aplicar el angostamiento de tipos normal (el
 * `!data` de abajo dejaba de narrowear `data` a no-nulo) — con esta
 * variable de tipo `boolean` esa rama sigue siendo código real para el
 * compilador, solo que nunca se ejecuta en tiempo de ejecución.
 */
const SHOW_ALERTS = false;

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
          de tipo administrativo, no personal).
          Alertas oculta temporalmente a pedido del usuario — componente
          y datos se dejan intactos, solo se deja de renderizar. La
          gráfica pasa a lg=12 siempre (antes solo para !isFullAccess)
          para ocupar el espacio que dejaba libre la columna de Alertas. */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={12}>
          {isLoading || !data ? (
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
          ) : (
            <CandidatesStatusChart data={data.candidatesByStatus} />
          )}
        </Grid>
        {SHOW_ALERTS && isFullAccess && (
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
          RECRUITER, sin cambios de este lado) + Acciones rápidas.
          RecentActivity pide su propia GET /dashboard/summary con
          from/to según el filtro de fecha que elija el usuario, así que
          ya no depende de `data`/`isLoading` de este hook — se monta
          siempre y maneja su propio loading/error internamente, lo que
          además deja que su petición salga en paralelo con la de arriba
          en vez de esperarla. */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RecentActivity />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <QuickActions />
        </Grid>
      </Grid>
    </Box>
  );
}

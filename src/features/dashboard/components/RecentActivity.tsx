import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import type { ActivityItem } from '../types/dashboard.types';
import { formatRelativeTime } from '@/shared/utils/relativeTime';
import { useAuth } from '@/features/auth/context/AuthContext';
import { CANDIDATE_STATUS_LABEL, type CandidateStatus } from '@/features/candidates/types/candidate.types';

interface RecentActivityProps {
  items: ActivityItem[];
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Verbos conjugados en 2 formas: "tú" (usuario autenticado) vs. tercera
 * persona (cualquier otro actor). Cubre los 9 códigos que declara el
 * backend (el enum `action` de GET /activity-log, la misma taxonomía que
 * llega en recentActivity). Cualquier código nuevo cae en el fallback
 * genérico, no rompe la UI.
 */
const ACTION_VERBS: Record<string, { self: string; other: string }> = {
  LOGIN: { self: 'iniciaste sesión', other: 'inició sesión' },
  LOGOUT: { self: 'cerraste sesión', other: 'cerró sesión' },
  CREATE_CANDIDATE: { self: 'creaste', other: 'creó' },
  ASSIGN_CANDIDATE: { self: 'asignaste', other: 'asignó' },
  UNASSIGN_CANDIDATE: { self: 'removiste la asignación de', other: 'removió la asignación de' },
  UPDATE_CANDIDATE_STATUS: { self: 'cambiaste', other: 'cambió' },
  ACTIVATE_CANDIDATE: { self: 'activaste', other: 'activó' },
  DEACTIVATE_CANDIDATE: { self: 'desactivaste', other: 'desactivó' },
  DELETE_USER: { self: 'eliminaste un usuario', other: 'eliminó un usuario' },
};

/**
 * Acciones que NO ocurren sobre un candidato: el backend las envía con
 * `candidate: null`, y su frase ya queda completa con el solo verbo.
 * Sin esta distinción, el respaldo de abajo las remataba con "un
 * candidato" — y un LOGIN se leía como "inició sesión un candidato".
 */
const NON_CANDIDATE_ACTIONS = new Set(['LOGIN', 'LOGOUT', 'DELETE_USER']);

function parseStatusFromDetails(details: string | undefined): CandidateStatus | undefined {
  const token = details?.match(/Status:\s*([A-Z_]+)/)?.[1];
  return token && token in CANDIDATE_STATUS_LABEL ? (token as CandidateStatus) : undefined;
}

function buildActionText(item: ActivityItem, isSelf: boolean): string {
  const verbs = ACTION_VERBS[item.action];
  const verb = verbs
    ? isSelf
      ? verbs.self
      : verbs.other
    : isSelf
      ? 'realizaste una acción en'
      : 'realizó una acción en';

  if (item.action === 'UPDATE_CANDIDATE_STATUS') {
    const status = parseStatusFromDetails(item.details);
    const statusLabel = status ? CANDIDATE_STATUS_LABEL[status] : undefined;
    if (item.candidateFolio && statusLabel) return `${verb} ${item.candidateFolio} a ${statusLabel}`;
  }

  if (item.candidateFolio) return `${verb} ${item.candidateFolio}`;

  // Acción conocida que no involucra candidato: el verbo ya es la frase.
  if (verbs && NON_CANDIDATE_ACTIONS.has(item.action)) return verb;

  return `${verb} un candidato`;
}

/**
 * `details` de las acciones sobre usuarios llega como una frase completa
 * en español desde el backend (ej. "Se eliminó al usuario Ana Ruiz
 * (ana@…)"), con más información que la que se puede reconstruir aquí.
 * Se muestra como segunda línea cuando no hay folio que mostrar.
 */
function supportingDetails(item: ActivityItem): string | undefined {
  if (item.candidateFolio) return undefined;
  return item.details?.trim() || undefined;
}

type TimeRange = 'today' | '3d' | '7d' | 'all';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '3d', label: 'Hace 3 días' },
  { value: '7d', label: '1 semana' },
  { value: 'all', label: 'Todos' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 'today' compara por día calendario (más intuitivo que una ventana de
 * 24h exactas); '3d'/'7d' sí son ventanas móviles desde `now`. 'all' no
 * filtra nada — es el escape hatch para ver todo lo que llegó del backend.
 */
function isWithinRange(isoDate: string, range: TimeRange, now: Date): boolean {
  if (range === 'all') return true;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  if (range === 'today') return isSameCalendarDay(date, now);
  const diffMs = now.getTime() - date.getTime();
  if (range === '3d') return diffMs <= 3 * DAY_MS;
  return diffMs <= 7 * DAY_MS;
}

export function RecentActivity({ items }: RecentActivityProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [search, setSearch] = useState('');

  const visibleItems = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (!isWithinRange(item.timestamp, timeRange, now)) return false;
      if (!query) return true;

      const isSelf = item.actorId !== undefined && item.actorId === user?.id;
      const haystack = [item.actor, buildActionText(item, isSelf), item.candidateFolio, supportingDetails(item)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, timeRange, search, user?.id]);

  if (items.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Actividad reciente
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Todavía no hay actividad registrada.
        </Typography>
      </Paper>
    );
  }

  return (
    // Altura fija (igual al Skeleton que ya la representa en
    // DashboardPage) en vez de `height: '100%'`: así el widget no crece
    // con la cantidad de actividad — la lista hace scroll internamente.
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 260, display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.25}
        sx={{ mb: 1.25 }}
      >
        <Typography variant="subtitle1">Actividad reciente</Typography>
        <TextField
          size="small"
          placeholder="Buscar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 170 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <ToggleButtonGroup
        value={timeRange}
        exclusive
        size="small"
        onChange={(_, value: TimeRange | null) => value && setTimeRange(value)}
        sx={{
          mb: 1.5,
          alignSelf: 'flex-start',
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            border: 'none',
            borderRadius: 2,
            px: 1.25,
            py: 0.375,
            color: 'text.secondary',
            fontSize: '0.8125rem',
            transition: 'background-color 0.2s ease, color 0.2s ease',
          },
          '& .MuiToggleButton-root.Mui-selected': {
            bgcolor: 'rgba(0,74,152,0.08)',
            color: 'primary.main',
            fontWeight: 600,
          },
          '& .MuiToggleButton-root.Mui-selected:hover': {
            bgcolor: 'rgba(0,74,152,0.12)',
          },
        }}
      >
        {TIME_RANGE_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {visibleItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No se encontró actividad con estos filtros.
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {visibleItems.map((item) => {
              const isSelf = item.actorId !== undefined && item.actorId === user?.id;
              // En la oración solo se usa el primer nombre ("Carlos asignó…"),
              // aunque el avatar sí usa el nombre completo para las iniciales.
              const firstName = item.actor.split(' ')[0];
              const actorLabel = isSelf ? 'Tú' : firstName;
              const details = supportingDetails(item);

              return (
                <Stack key={item.id} direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: 'secondary.main' }}>
                    {initialsOf(item.actor)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2">
                      <Typography component="span" variant="body2" fontWeight={600}>
                        {actorLabel}
                      </Typography>{' '}
                      {buildActionText(item, isSelf)}
                    </Typography>
                    {details && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {details}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(item.timestamp)}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

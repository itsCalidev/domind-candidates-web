import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
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
 * persona (cualquier otro actor). Solo cubre los códigos de acción que
 * hemos visto en el contrato real — cualquier código nuevo cae en el
 * fallback genérico, no rompe la UI.
 */
const ACTION_VERBS: Record<string, { self: string; other: string }> = {
  ASSIGN_CANDIDATE: { self: 'asignaste', other: 'asignó' },
  UPDATE_CANDIDATE_STATUS: { self: 'cambiaste', other: 'cambió' },
  CREATE_CANDIDATE: { self: 'creaste', other: 'creó' },
};

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
  return `${verb} un candidato`;
}

export function RecentActivity({ items }: RecentActivityProps) {
  const { user } = useAuth();

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
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Actividad reciente
      </Typography>

      <Stack spacing={2.5}>
        {items.map((item) => {
          const isSelf = item.actorId !== undefined && item.actorId === user?.id;
          // En la oración solo se usa el primer nombre ("Carlos asignó…"),
          // aunque el avatar sí usa el nombre completo para las iniciales.
          const firstName = item.actor.split(' ')[0];
          const actorLabel = isSelf ? 'Tú' : firstName;

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
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(item.timestamp)}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

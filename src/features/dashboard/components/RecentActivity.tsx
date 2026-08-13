import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
import type { ActivityItem } from '../types/dashboard.types';
import { formatRelativeTime } from '@/shared/utils/relativeTime';
import { useAuth } from '@/features/auth/context/AuthContext';

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

export function RecentActivity({ items }: RecentActivityProps) {
  const { user } = useAuth();

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Actividad reciente
      </Typography>

      <Stack spacing={2.5}>
        {items.map((item) => {
          // "Tú" en vez del nombre cuando la actividad es del usuario
          // autenticado. Con datos mock nunca coincide (actorId no
          // apunta a un usuario real) — el mecanismo queda listo para
          // cuando la actividad venga del backend real.
          const isCurrentUser = item.actorId !== undefined && item.actorId === user?.id;
          const actorLabel = isCurrentUser ? 'Tú' : item.actor;

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
                  {item.action}
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

import { Avatar, Box, Paper, Stack, Typography } from '@mui/material';
import type { ActivityItem } from '../types/dashboard.types';

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
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Actividad reciente
      </Typography>

      <Stack spacing={2.5}>
        {items.map((item) => (
          <Stack key={item.id} direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: 'secondary.main' }}>
              {initialsOf(item.actor)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2">
                <Typography component="span" variant="body2" fontWeight={600}>
                  {item.actor}
                </Typography>{' '}
                {item.action}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.timestamp}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

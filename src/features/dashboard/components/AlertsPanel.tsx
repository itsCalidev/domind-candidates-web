import { Box, Paper, Stack, Typography } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { AlertItem } from '../types/dashboard.types';

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const severityColor: Record<AlertItem['severity'], string> = {
  warning: '#F39200',
  error: '#D32F2F',
  info: '#0083C1',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Alertas
      </Typography>

      <Stack spacing={2}>
        {alerts.map((alert) => {
          const Icon = alert.severity === 'info' ? InfoOutlinedIcon : WarningAmberOutlinedIcon;
          const color = severityColor[alert.severity];

          return (
            <Stack key={alert.id} direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${color}1A`,
                  color,
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {alert.message}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

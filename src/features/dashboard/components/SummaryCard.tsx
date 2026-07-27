import { Box, Fade, Paper, Typography } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import type { SummaryMetric } from '../types/dashboard.types';

const iconByType = {
  new: PersonAddAltOutlinedIcon,
  inProgress: HourglassEmptyOutlinedIcon,
  review: FactCheckOutlinedIcon,
  approved: CheckCircleOutlineOutlinedIcon,
} as const;

interface SummaryCardProps {
  metric: SummaryMetric;
  /** Retraso de entrada, para escalonar la animación entre cards */
  delayMs?: number;
}

export function SummaryCard({ metric, delayMs = 0 }: SummaryCardProps) {
  const Icon = iconByType[metric.icon];

  return (
    <Fade in timeout={400} style={{ transitionDelay: `${delayMs}ms` }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 20px rgba(0,0,0,0.08)',
          },
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {metric.label}
          </Typography>
          <Typography variant="h4">{metric.value}</Typography>
          {metric.delta && (
            <Typography variant="caption" color="text.secondary">
              {metric.delta}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${metric.accentColor}1A`,
            color: metric.accentColor,
          }}
        >
          <Icon fontSize="small" />
        </Box>
      </Paper>
    </Fade>
  );
}

import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { VisuallyHidden } from '@/shared/components/VisuallyHidden';
import type { CandidatesByStatusPoint } from '../types/dashboard.types';

interface CandidatesStatusChartProps {
  data: CandidatesByStatusPoint[];
}

/** Un color por barra, coherente con la paleta corporativa. 6 valores: uno por cada CandidateStatus real. */
const barColors = ['#67B1E3', '#69478E', '#F39200', '#76B82A', '#D32F2F', '#706F6F'];

export function CandidatesStatusChart({ data }: CandidatesStatusChartProps) {
  const theme = useTheme();

  const description = `Gráfica de barras con la distribución de candidatos por estado: ${data
    .map((point) => `${point.status}, ${point.total}`)
    .join('; ')}.`;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Candidatos por estado
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Distribución actual del pipeline de candidatos
      </Typography>

      <Box>
        <VisuallyHidden>{description}</VisuallyHidden>
        <ResponsiveContainer width="100%" height={260} aria-hidden="true">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={theme.palette.divider} />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="status"
              width={100}
              tick={{ fontSize: 13, fill: theme.palette.text.primary }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: theme.palette.action.hover }}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                fontSize: 13,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }}
              labelStyle={{ color: theme.palette.text.primary }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={entry.status} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

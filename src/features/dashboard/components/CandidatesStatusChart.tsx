import { Paper, Typography } from '@mui/material';
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
import type { CandidatesByStatusPoint } from '../types/dashboard.types';

interface CandidatesStatusChartProps {
  data: CandidatesByStatusPoint[];
}

/** Un color por barra, coherente con la paleta corporativa */
const barColors = ['#F39200', '#67B1E3', '#0083C1', '#76B82A'];

export function CandidatesStatusChart({ data }: CandidatesStatusChartProps) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Candidatos por estado
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Distribución actual del pipeline de candidatos
      </Typography>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="#EEEFF1" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#706F6F' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={100}
            tick={{ fontSize: 13, fill: '#1A1A1A' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,74,152,0.04)' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #EEEFF1', fontSize: 13 }}
          />
          <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

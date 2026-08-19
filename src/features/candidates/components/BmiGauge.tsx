import { Box, Stack, Typography, useTheme, type Theme } from '@mui/material';
import { Cell, Pie, PieChart } from 'recharts';

interface BmiGaugeProps {
  weightKg: number | null;
  heightM: number | null;
}

const GAUGE_WIDTH = 280;
const GAUGE_HEIGHT = 180;
const CENTER_X = GAUGE_WIDTH / 2;
const CENTER_Y = GAUGE_HEIGHT - 10;
const OUTER_RADIUS = 130;
const INNER_RADIUS = 85;
const NEEDLE_LENGTH = 110;

/** Escala del velocímetro: cubre desde bajo peso severo hasta obesidad avanzada. */
const BMI_SCALE_MIN = 15;
const BMI_SCALE_MAX = 40;

function getBmiCategory(bmi: number, theme: Theme): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Bajo peso', color: theme.palette.info.main };
  if (bmi < 25) return { label: 'Normal', color: theme.palette.success.main };
  if (bmi < 30) return { label: 'Sobrepeso', color: theme.palette.warning.main };
  return { label: 'Obesidad', color: theme.palette.error.main };
}

/**
 * Velocímetro de IMC: un PieChart de Recharts cortado a la mitad
 * (`startAngle={180} endAngle={0}`, `cy="100%"`) con 4 segmentos de
 * ancho proporcional a cada rango clínico, más una aguja dibujada a
 * mano en un <svg> superpuesto — Recharts no trae agujas de gauge, así
 * que se calcula la posición con trigonometría simple sobre el mismo
 * centro (CENTER_X, CENTER_Y) que usa el Pie.
 */
export function BmiGauge({ weightKg, heightM }: BmiGaugeProps) {
  const theme = useTheme();

  if (!weightKg || !heightM) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: GAUGE_HEIGHT, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Datos insuficientes para calcular el IMC.
        </Typography>
      </Stack>
    );
  }

  const bmi = weightKg / (heightM * heightM);
  const category = getBmiCategory(bmi, theme);

  const segments = [
    { label: 'Bajo peso', width: 3.5, color: theme.palette.info.main },
    { label: 'Normal', width: 6.4, color: theme.palette.success.main },
    { label: 'Sobrepeso', width: 4.9, color: theme.palette.warning.main },
    { label: 'Obesidad', width: 10.1, color: theme.palette.error.main },
  ];

  const fraction = Math.min(1, Math.max(0, (bmi - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)));
  const angleRad = ((180 - fraction * 180) * Math.PI) / 180;
  const needleX = CENTER_X + NEEDLE_LENGTH * Math.cos(angleRad);
  const needleY = CENTER_Y - NEEDLE_LENGTH * Math.sin(angleRad);

  return (
    <Stack alignItems="center" spacing={1}>
      <Box sx={{ position: 'relative', width: GAUGE_WIDTH, height: GAUGE_HEIGHT }}>
        <PieChart width={GAUGE_WIDTH} height={GAUGE_HEIGHT} aria-hidden="true">
          <Pie
            data={segments}
            dataKey="width"
            nameKey="label"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={INNER_RADIUS}
            outerRadius={OUTER_RADIUS}
            stroke="none"
            isAnimationActive={false}
          >
            {segments.map((segment) => (
              <Cell key={segment.label} fill={segment.color} />
            ))}
          </Pie>
        </PieChart>

        <svg
          width={GAUGE_WIDTH}
          height={GAUGE_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={needleX}
            y2={needleY}
            stroke={theme.palette.text.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={CENTER_X} cy={CENTER_Y} r={6} fill={theme.palette.text.primary} />
        </svg>

        <Box sx={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>
            {bmi.toFixed(1)}
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ color: category.color }}>
            {category.label}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
        Índice de Masa Corporal ({weightKg} kg / {heightM} m)
      </Typography>
    </Stack>
  );
}

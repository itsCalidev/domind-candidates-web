import { Box, Stack, Typography } from '@mui/material';
import type { HealthRiskFactor } from '../utils/healthRisk';

interface RiskGlassProps {
  total: number;
  factors: HealthRiskFactor[];
}

const GLASS_WIDTH = 64;
const GLASS_HEIGHT = 200;

/**
 * "Vaso de riesgo acumulado": un tubo vertical que se llena de abajo
 * hacia arriba, un bloque de color por hábito de riesgo presente. Es
 * CSS puro (no un gauge de librería) — `flexDirection: 'column-reverse'`
 * hace que el primer factor activo del arreglo (el de más peso,
 * usedDrugs) quede pintado hasta abajo, como el fondo del vaso.
 */
export function RiskGlass({ total, factors }: RiskGlassProps) {
  const activeFactors = factors.filter((factor) => factor.active);

  return (
    <Stack alignItems="center" spacing={1}>
      <Typography variant="h6" fontWeight={700}>
        {total}%
      </Typography>

      <Box
        sx={{
          width: GLASS_WIDTH,
          height: GLASS_HEIGHT,
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: '10px 10px 28px 28px',
          bgcolor: 'action.hover',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column-reverse',
        }}
        role="img"
        aria-label={`Vaso de riesgo acumulado por hábitos: ${total} por ciento. ${
          activeFactors.length === 0
            ? 'Sin factores de riesgo detectados.'
            : `Factores presentes: ${activeFactors.map((factor) => factor.label).join(', ')}.`
        }`}
      >
        {activeFactors.map((factor) => (
          <Box
            key={factor.label}
            sx={{
              height: `${factor.weight}%`,
              width: '100%',
              bgcolor: factor.color,
              borderTop: '2px solid rgba(255,255,255,0.35)',
              flexShrink: 0,
            }}
          />
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" textAlign="center">
        Riesgo acumulado
      </Typography>
    </Stack>
  );
}

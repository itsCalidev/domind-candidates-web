import { Stack, Typography } from '@mui/material';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';

/**
 * Estado vacío "que transmite buenas noticias": ícono verde + texto,
 * para cuando la ausencia de datos ES la información positiva (sin
 * antecedentes médicos, no fuma, sin deuda hipotecaria...). Nació en
 * HealthTab (antecedentes/cirugías/tabaco/drogas/alcohol) y se promovió
 * a shared/ cuando HousingTab lo necesitó también para "Sin deuda
 * hipotecaria / Infonavit" — misma idea, dominio distinto.
 *
 * El ícono es configurable (default: escudo) porque algunos casos piden
 * uno más específico, ej. SmokeFreeOutlined para "No fuma".
 */
export function CleanStateBadge({
  label,
  icon: Icon = HealthAndSafetyOutlinedIcon,
}: {
  label: string;
  icon?: typeof HealthAndSafetyOutlinedIcon;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Icon fontSize="small" color="success" />
      <Typography variant="body2" fontWeight={600} color="success.main">
        {label}
      </Typography>
    </Stack>
  );
}

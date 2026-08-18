import { Chip, Grid, Stack, Typography, type GridProps } from '@mui/material';

type FieldValue = string | number | boolean | null | undefined;

function formatFieldValue(value: FieldValue): string {
  if (value === null || value === undefined || value === '') return 'No especificado';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

/**
 * Celda de dato de solo lectura, reutilizada por las pestañas del
 * expediente (Familia, Salud, Vivienda). Centraliza el criterio de
 * "campo nulo" pedido para toda la vista: siempre "No especificado", nunca
 * un `undefined` o un guion suelto.
 */
export function DetailField({
  label,
  value,
  size = { xs: 12, sm: 6, md: 4 },
}: {
  label: string;
  value: FieldValue;
  size?: GridProps['size'];
}) {
  return (
    <Grid size={size}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {formatFieldValue(value)}
      </Typography>
    </Grid>
  );
}

/** Misma semántica que DetailField, para campos de selección múltiple (arreglos de string). */
export function ChipListField({
  label,
  values,
  size = { xs: 12, sm: 6, md: 4 },
}: {
  label: string;
  values: string[];
  size?: GridProps['size'];
}) {
  return (
    <Grid size={size}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {values.length === 0 ? (
        <Typography variant="body2" fontWeight={500}>
          No especificado
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {values.map((value) => (
            <Chip key={value} label={value} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Grid>
  );
}

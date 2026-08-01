/**
 * Formatea una fecha ISO a un formato corto y legible ("12 jul 2026").
 * Usa Intl.DateTimeFormat nativo — no se justifica una librería de
 * fechas para un único campo de presentación como este.
 */
export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

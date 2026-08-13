/**
 * Convierte una fecha ISO a texto relativo en español ("Hace 5 minutos",
 * "Hace 2 horas", "Hace 3 días"). Genérico — no conoce Dashboard,
 * Activity Log ni ningún dominio; listo para reutilizarse en cualquier
 * lista de eventos con fecha real.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return 'Hace un momento';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

  // Más de una semana: fecha corta en vez de "hace N semanas/meses".
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
}

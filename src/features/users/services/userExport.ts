import type { CsvColumn } from '@/shared/utils/csv';
import { formatShortDate } from '@/shared/utils/formatDate';
import type { User } from '../types/user.types';

/**
 * Columnas de exportación para Users — exactamente la misma información
 * que ya muestra UsersTable (Nombre/Apellido, Correo, Rol, Estado,
 * Última actualización). El rol se exporta con el valor crudo del
 * backend, sin traducir (misma regla que en toda la app).
 *
 * Cuando exista la plantilla PDF institucional, esta es la única pieza
 * de "transformación" que se reutiliza tal cual — solo cambia la capa
 * de generación de archivo (ver shared/utils/csv.ts).
 */
export const USER_EXPORT_COLUMNS: CsvColumn<User>[] = [
  { label: 'Nombre', getValue: (u) => u.firstName },
  { label: 'Apellido', getValue: (u) => u.lastName },
  { label: 'Correo', getValue: (u) => u.email },
  { label: 'Rol', getValue: (u) => u.role },
  { label: 'Estado', getValue: (u) => (u.isActive ? 'Activo' : 'Inactivo') },
  { label: 'Última actualización', getValue: (u) => formatShortDate(u.updatedAt) },
];

/**
 * Subtítulo del PDF tabular de Users: fecha/hora de generación +
 * filtros activos, igual que buildCandidatesPdfSubtitle. Mismos 6
 * columnas que USER_EXPORT_COLUMNS — a diferencia de Candidates, aquí
 * no hace falta un subconjunto: el CSV de Users ya coincide exactamente
 * con lo que muestra la tabla, así que el PDF reutiliza el mismo arreglo tal cual.
 */
export function buildUsersPdfSubtitle(filters: {
  search: string;
  roleFilter: string;
  statusFilter: string;
}): string {
  const parts: string[] = [];

  if (filters.search.trim()) parts.push(`Búsqueda: "${filters.search.trim()}"`);
  if (filters.roleFilter !== 'all') parts.push(`Rol: ${filters.roleFilter}`);
  if (filters.statusFilter !== 'all') {
    parts.push(`Estado: ${filters.statusFilter === 'active' ? 'Activo' : 'Inactivo'}`);
  }

  const filtersText = parts.length > 0 ? parts.join(' · ') : 'Sin filtros aplicados';
  const generatedAt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(),
  );

  return `Generado el ${generatedAt} · ${filtersText}`;
}

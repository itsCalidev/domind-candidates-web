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

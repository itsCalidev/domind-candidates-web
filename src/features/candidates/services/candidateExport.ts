import type { CsvColumn } from '@/shared/utils/csv';
import { CANDIDATE_STATUS_LABEL, type CandidateListItem, type CandidateStatus } from '../types/candidate.types';
import type { CandidateActiveFilter } from '../hooks/useCandidatesList';

// Cada columna se define una sola vez; CANDIDATE_EXPORT_COLUMNS (CSV) y
// CANDIDATE_PDF_TABLE_COLUMNS (PDF) se componen a partir de las mismas
// constantes — así ninguna traducción/transformación queda duplicada
// entre los dos formatos.
const folioColumn: CsvColumn<CandidateListItem> = { label: 'Folio', getValue: (c) => c.folio };
const fullNameColumn: CsvColumn<CandidateListItem> = { label: 'Nombre completo', getValue: (c) => c.fullName };
const emailColumn: CsvColumn<CandidateListItem> = { label: 'Correo', getValue: (c) => c.email };
const companyColumn: CsvColumn<CandidateListItem> = { label: 'Empresa', getValue: (c) => c.companyName };
const positionColumn: CsvColumn<CandidateListItem> = {
  label: 'Puesto solicitado',
  getValue: (c) => c.positionName,
};
// Traducción SIEMPRE vía CANDIDATE_STATUS_LABEL: nunca el enum crudo del backend.
const statusColumn: CsvColumn<CandidateListItem> = {
  label: 'Estado',
  getValue: (c) => CANDIDATE_STATUS_LABEL[c.status],
};
const activeColumn: CsvColumn<CandidateListItem> = {
  label: 'Activo',
  getValue: (c) => (c.isActive ? 'Sí' : 'No'),
};

/**
 * Columnas de exportación CSV para el listado — la misma información
 * que ya muestra CandidatesTable (candidato, empresa, puesto, estado,
 * activo/inactivo). No se exponen campos que la tabla no muestra.
 */
export const CANDIDATE_EXPORT_COLUMNS: CsvColumn<CandidateListItem>[] = [
  folioColumn,
  fullNameColumn,
  emailColumn,
  companyColumn,
  positionColumn,
  statusColumn,
  activeColumn,
];

/**
 * Subconjunto para el PDF tabular del listado: exactamente las columnas
 * visibles en CandidatesTable (Folio, Candidato, Empresa, Puesto,
 * Estado) — ni más ni menos. Reutiliza las mismas constantes de arriba,
 * no las reescribe.
 */
export const CANDIDATE_PDF_TABLE_COLUMNS: CsvColumn<CandidateListItem>[] = [
  folioColumn,
  fullNameColumn,
  companyColumn,
  positionColumn,
  statusColumn,
];

/**
 * Subtítulo del PDF tabular: fecha/hora de generación + filtros
 * activos, siempre en español (sin exponer los valores 'active'/
 * 'inactive' del filtro ni el enum crudo del estado).
 */
export function buildCandidatesPdfSubtitle(filters: {
  search: string;
  statusFilter: CandidateStatus | 'all';
  activeFilter: CandidateActiveFilter;
}): string {
  const parts: string[] = [];

  if (filters.search.trim()) parts.push(`Búsqueda: "${filters.search.trim()}"`);
  if (filters.statusFilter !== 'all') parts.push(`Estado: ${CANDIDATE_STATUS_LABEL[filters.statusFilter]}`);
  if (filters.activeFilter !== 'all') {
    parts.push(`Activo: ${filters.activeFilter === 'active' ? 'Sí' : 'No'}`);
  }

  const filtersText = parts.length > 0 ? parts.join(' · ') : 'Sin filtros aplicados';
  const generatedAt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(),
  );

  return `Generado el ${generatedAt} · ${filtersText}`;
}

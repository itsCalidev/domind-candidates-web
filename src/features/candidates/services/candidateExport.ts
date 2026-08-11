import type { CsvColumn } from '@/shared/utils/csv';
import { CANDIDATE_STATUS_LABEL, type CandidateListItem } from '../types/candidate.types';

/**
 * Columnas de exportación para Candidates — la misma información que ya
 * muestra CandidatesTable (nombre, correo, puesto, estado, avance).
 *
 * IMPORTANTE: el modelo actual de Candidates sigue siendo el mock de
 * fases anteriores (no los campos reales del backend — folio,
 * companyName, assignedRecruiter, etc.). No se agregan esos campos aquí
 * porque no existen todavía en CandidateListItem; cuando el módulo se
 * conecte al backend real, este es el único archivo que necesita
 * actualizarse para reflejar las columnas reales.
 */
export const CANDIDATE_EXPORT_COLUMNS: CsvColumn<CandidateListItem>[] = [
  { label: 'Nombre completo', getValue: (c) => c.fullName },
  { label: 'Correo', getValue: (c) => c.email },
  { label: 'Empresa', getValue: (c) => c.companyName },
  { label: 'Puesto solicitado', getValue: (c) => c.positionName },
  { label: 'Estado', getValue: (c) => CANDIDATE_STATUS_LABEL[c.status] },
];

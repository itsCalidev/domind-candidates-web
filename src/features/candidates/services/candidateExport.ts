import type { CsvColumn } from '@/shared/utils/csv';
import type { PdfRow } from '@/shared/utils/pdf';
import { CANDIDATE_STATUS_LABEL, type CandidateDetail, type CandidateListItem } from '../types/candidate.types';

/**
 * Columnas de exportación CSV para el listado — la misma información
 * que ya muestra CandidatesTable (candidato, empresa, puesto, estado,
 * activo/inactivo). No se exponen campos que la tabla no muestra.
 */
export const CANDIDATE_EXPORT_COLUMNS: CsvColumn<CandidateListItem>[] = [
  { label: 'Folio', getValue: (c) => c.folio },
  { label: 'Nombre completo', getValue: (c) => c.fullName },
  { label: 'Correo', getValue: (c) => c.email },
  { label: 'Empresa', getValue: (c) => c.companyName },
  { label: 'Puesto solicitado', getValue: (c) => c.positionName },
  { label: 'Estado', getValue: (c) => CANDIDATE_STATUS_LABEL[c.status] },
  { label: 'Activo', getValue: (c) => (c.isActive ? 'Sí' : 'No') },
];

/**
 * Filas "Campo | Valor" para el PDF de UN candidato (vista de detalle),
 * no del listado. Misma información que ya muestra
 * GeneralInfoTab — es la capa de "transformación de datos" separada de
 * la de "generación de archivo" (ver shared/utils/pdf.ts), para que
 * cuando exista la plantilla institucional solo cambie esa última capa.
 */
export function transformCandidateDetailForPdf(candidate: CandidateDetail): PdfRow[] {
  const { generalInfo } = candidate;

  return [
    { label: 'Folio', value: candidate.folio },
    { label: 'Nombre', value: generalInfo.fullName },
    { label: 'Puesto solicitado', value: generalInfo.positionApplied },
    { label: 'Empresa', value: candidate.companyName },
    { label: 'Estado', value: CANDIDATE_STATUS_LABEL[candidate.status] },
    { label: 'Domicilio', value: generalInfo.address },
    { label: 'Colonia', value: generalInfo.neighborhood },
    { label: 'Código postal', value: generalInfo.postalCode },
    { label: 'Teléfono', value: generalInfo.phone },
    { label: 'Correo', value: generalInfo.email },
    { label: 'Fecha de nacimiento', value: generalInfo.birthDate },
    { label: 'Lugar de nacimiento', value: generalInfo.birthPlace },
    { label: 'Estado civil', value: generalInfo.civilStatus },
  ];
}

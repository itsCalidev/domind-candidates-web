import type { DocumentType } from '../types/candidate.types';

export interface DocumentDefinition {
  type: DocumentType;
  label: string;
}

/**
 * Los 7 documentos esperados del expediente, en el orden dado por el
 * usuario (NSS/RFC agregados después de los 5 originales). Fuente única
 * de verdad compartida entre `DocumentationTab` (checklist visual) y
 * `candidateCompleteness` (validador de "Finalizar captura") — antes
 * vivía duplicado solo en el componente.
 */
export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  { type: 'INE', label: 'INE' },
  { type: 'ACTA_NACIMIENTO', label: 'Acta de Nacimiento' },
  { type: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de Domicilio' },
  { type: 'ANTECEDENTES_PENALES', label: 'Antecedentes Penales' },
  { type: 'COMPROBANTE_ESTUDIOS', label: 'Comprobante de Estudios' },
  { type: 'NSS', label: 'Número de Seguridad Social' },
  { type: 'RFC', label: 'RFC' },
];

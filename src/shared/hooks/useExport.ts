import { useState } from 'react';
import type { SelectionPayload } from '@/shared/hooks/useRowSelection';
import { resolveSelectionRecords } from '@/shared/utils/exportSelection';

export interface UseExportOptions<T, ID> {
  currentPageItems: T[];
  getId: (item: T) => ID;
  getSelectionPayload: () => SelectionPayload<ID>;
  totalPages: number;
  pageSize: number;
  fetchPage: (page: number, pageSize: number) => Promise<T[]>;
  /**
   * Genera y descarga el archivo a partir de los registros ya
   * resueltos — puede ser `downloadCsv(...)`, `downloadTablePdf(...)`
   * o cualquier formato futuro. Este hook no conoce el formato de
   * salida: solo resuelve QUÉ registros exportar (capas 1 y 2 de la
   * arquitectura), nunca CÓMO se generan (capa 3).
   */
  generateFile: (records: T[]) => void;
}

/**
 * Orquesta la resolución de registros a exportar (selección → capa de
 * generación) para una tabla específica. No sabe qué es un User o un
 * Candidate, ni si el resultado es CSV o PDF: todo el conocimiento de
 * dominio y de formato entra por `getId`, `fetchPage` y `generateFile`,
 * que cada consumidor provee.
 */
export function useExport<T, ID>({
  currentPageItems,
  getId,
  getSelectionPayload,
  totalPages,
  pageSize,
  fetchPage,
  generateFile,
}: UseExportOptions<T, ID>) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runExport() {
    setIsExporting(true);
    setError(null);
    try {
      const records = await resolveSelectionRecords({
        payload: getSelectionPayload(),
        currentPageItems,
        getId,
        totalPages,
        pageSize,
        fetchPage,
      });
      generateFile(records);
    } catch {
      setError('No se pudo generar la exportación. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return { isExporting, error, runExport };
}

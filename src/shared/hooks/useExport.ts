import { useState } from 'react';
import type { SelectionPayload } from '@/shared/hooks/useRowSelection';
import { resolveSelectionRecords } from '@/shared/utils/exportSelection';
import { downloadCsv, type CsvColumn } from '@/shared/utils/csv';

export interface UseExportOptions<T, ID> {
  currentPageItems: T[];
  getId: (item: T) => ID;
  getSelectionPayload: () => SelectionPayload<ID>;
  totalPages: number;
  pageSize: number;
  fetchPage: (page: number, pageSize: number) => Promise<T[]>;
  columns: CsvColumn<T>[];
  fileName: string;
}

/**
 * Orquesta las 3 capas de exportación (selección → transformación de
 * columnas → generación de archivo) para una tabla específica. No sabe
 * qué es un User o un Candidate: todo el conocimiento de dominio entra
 * por `columns`, `getId` y `fetchPage`, que cada página provee.
 */
export function useExport<T, ID>({
  currentPageItems,
  getId,
  getSelectionPayload,
  totalPages,
  pageSize,
  fetchPage,
  columns,
  fileName,
}: UseExportOptions<T, ID>) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportToCsv() {
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
      downloadCsv(fileName, records, columns);
    } catch {
      setError('No se pudo generar la exportación. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }

  return { isExporting, error, exportToCsv };
}

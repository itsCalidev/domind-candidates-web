import type { SelectionPayload } from '@/shared/hooks/useRowSelection';

/**
 * Capa 1 de la exportación: "selección de registros". Convierte el
 * SelectionPayload (que en modo `exclude` NO trae los objetos completos
 * — solo excepciones, ver useRowSelection) en el arreglo real de filas
 * a exportar. No conoce Users/Candidates: recibe `fetchPage` como
 * dependencia, que cada feature implementa reutilizando su propio hook
 * de datos (mismo filtro/orden que ya usa la tabla, sin duplicarlo).
 */
export interface ResolveSelectionRecordsParams<T, ID> {
  payload: SelectionPayload<ID>;
  /** Filas ya cargadas de la página actual — se usan tal cual si no hay selección. */
  currentPageItems: T[];
  getId: (item: T) => ID;
  totalPages: number;
  pageSize: number;
  /** Pide una página específica bajo los mismos filtros activos de la tabla. */
  fetchPage: (page: number, pageSize: number) => Promise<T[]>;
}

export async function resolveSelectionRecords<T, ID>({
  payload,
  currentPageItems,
  getId,
  totalPages,
  pageSize,
  fetchPage,
}: ResolveSelectionRecordsParams<T, ID>): Promise<T[]> {
  // Sin selección: exportar la vista actual, sin pedir nada más al backend.
  if (payload.mode === 'include' && payload.ids.length === 0) {
    return currentPageItems;
  }

  // Con selección (individual o "todos los N"): se necesitan los
  // registros completos de TODAS las páginas para poder filtrar por
  // ID/excepción con certeza, sin importar en qué página se seleccionó
  // cada fila originalmente.
  const pages = await Promise.all(
    Array.from({ length: totalPages }, (_, index) => fetchPage(index + 1, pageSize)),
  );
  const allItems = pages.flat();

  if (payload.mode === 'include') {
    const idSet = new Set(payload.ids);
    return allItems.filter((item) => idSet.has(getId(item)));
  }

  const excludeSet = new Set(payload.ids);
  return allItems.filter((item) => !excludeSet.has(getId(item)));
}

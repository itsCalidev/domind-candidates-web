import { useCallback, useMemo, useState } from 'react';

/**
 * Descriptor compacto de la selección, pensado para acciones futuras
 * (exportar, eliminar masivo, etc.) que se ejecutan contra el backend.
 *
 * En modo `exclude`, NO se envían los IDs de todo lo seleccionado (podría
 * ser miles de registros no cargados en memoria) — se envía el filtro
 * implícito ("todo") más las excepciones. El backend resuelve el resto
 * con la misma query de filtros que ya usa para listar.
 */
export type SelectionPayload<ID> =
  | { mode: 'include'; ids: ID[] }
  | { mode: 'exclude'; ids: ID[]; totalCount: number };

export interface UseRowSelectionOptions<ID> {
  /** IDs de las filas cargadas actualmente (la página visible). */
  pageIds: ID[];
  /**
   * Total de registros que coinciden con los filtros activos, a través
   * de TODAS las páginas (ej. pagination.total del backend). Sin este
   * valor, "seleccionar todos los N" no se ofrece — solo selección de
   * la página actual.
   */
  totalCount?: number;
}

export interface UseRowSelectionResult<ID> {
  /** Estado del checkbox del encabezado, relativo a la página visible. */
  headerState: 'checked' | 'indeterminate' | 'unchecked';
  /** true únicamente cuando TODOS los registros (todas las páginas) están seleccionados. */
  isAllSelected: boolean;
  /** Cantidad seleccionada, correcta en ambos modos. */
  selectedCount: number;
  hasSelection: boolean;
  isSelected: (id: ID) => boolean;
  toggleRow: (id: ID) => void;
  /** Selecciona/deselecciona solo las filas de `pageIds`. */
  toggleAllOnPage: () => void;
  /** Activa selección de TODOS los registros que coinciden con el filtro, en todas las páginas. */
  selectAllMatching: () => void;
  clearSelection: () => void;
  getSelectionPayload: () => SelectionPayload<ID>;
}

/**
 * Estado de selección de filas, reutilizable por cualquier tabla del
 * proyecto (Users, Candidates, lo que venga). No conoce nada de ningún
 * dominio: solo trabaja con IDs.
 *
 * Diseñado para paginación server-side desde el día uno — ver
 * SelectionPayload para el porqué del modo `include`/`exclude`.
 *
 * Contrato de accesibilidad para quien lo consuma (los <Checkbox> viven
 * en cada tabla, no aquí, así que esto es responsabilidad del código
 * que use el hook):
 * - El checkbox del encabezado usa `indeterminate` de MUI (soporte
 *   nativo, no reinventar) con `headerState`, y necesita un
 *   `aria-label` propio (ej. "Seleccionar todas las filas visibles").
 * - Cada checkbox de fila necesita `aria-label` describiendo la fila
 *   (ej. "Seleccionar a {nombre}"), no solo "Seleccionar".
 * - No sobreescribir `:focus-visible` de MUI con estilos propios.
 */
export function useRowSelection<ID>({
  pageIds,
  totalCount,
}: UseRowSelectionOptions<ID>): UseRowSelectionResult<ID> {
  const [mode, setMode] = useState<'include' | 'exclude'>('include');
  const [ids, setIds] = useState<Set<ID>>(new Set());

  const isSelected = useCallback(
    (id: ID) => (mode === 'include' ? ids.has(id) : !ids.has(id)),
    [mode, ids],
  );

  const toggleRow = useCallback((id: ID) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => isSelected(id));
  const someOnPageSelected = pageIds.some((id) => isSelected(id));

  const headerState: UseRowSelectionResult<ID>['headerState'] = allOnPageSelected
    ? 'checked'
    : someOnPageSelected
      ? 'indeterminate'
      : 'unchecked';

  const toggleAllOnPage = useCallback(() => {
    const shouldSelect = !allOnPageSelected;
    setIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        // En modo 'exclude', "seleccionar" significa quitarlo de las
        // excepciones — la mecánica del Set es simétrica, solo cambia
        // la interpretación según el modo.
        const shouldBeInSet = mode === 'include' ? shouldSelect : !shouldSelect;
        if (shouldBeInSet) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, [allOnPageSelected, mode, pageIds]);

  const selectAllMatching = useCallback(() => {
    setMode('exclude');
    setIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setMode('include');
    setIds(new Set());
  }, []);

  const selectedCount = useMemo(() => {
    if (mode === 'include') return ids.size;
    const base = totalCount ?? pageIds.length;
    return Math.max(0, base - ids.size);
  }, [mode, ids, totalCount, pageIds.length]);

  const isAllSelected = totalCount !== undefined && selectedCount === totalCount;

  const getSelectionPayload = useCallback((): SelectionPayload<ID> => {
    if (mode === 'include') return { mode: 'include', ids: Array.from(ids) };
    return { mode: 'exclude', ids: Array.from(ids), totalCount: totalCount ?? pageIds.length };
  }, [mode, ids, totalCount, pageIds.length]);

  return {
    headerState,
    isAllSelected,
    selectedCount,
    hasSelection: selectedCount > 0,
    isSelected,
    toggleRow,
    toggleAllOnPage,
    selectAllMatching,
    clearSelection,
    getSelectionPayload,
  };
}

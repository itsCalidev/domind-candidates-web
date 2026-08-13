import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { candidatesService } from '../services/candidateService';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/table';
import type { CandidateStatus } from '../types/candidate.types';

const SEARCH_DEBOUNCE_MS = 400;

export type CandidateActiveFilter = 'all' | 'active' | 'inactive';

/**
 * Ahora consume GET /candidates real (antes era candidates.mock en
 * memoria). Mismo patrón que useUsersQuery: TanStack Query, búsqueda
 * debounced, keepPreviousData, y un fetchPage reutilizable para
 * exportación bajo los mismos filtros activos.
 */
export function useCandidatesList() {
  const [searchInput, setSearchInputState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilterState] = useState<CandidateStatus | 'all'>('all');
  const [activeFilter, setActiveFilterState] = useState<CandidateActiveFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  function setSearch(value: string) {
    setSearchInputState(value);
  }

  function setStatusFilter(value: CandidateStatus | 'all') {
    setStatusFilterState(value);
    setPage(1);
  }

  function setActiveFilter(value: CandidateActiveFilter) {
    setActiveFilterState(value);
    setPage(1);
  }

  function setPageSize(value: number) {
    setPageSizeState(value);
    setPage(1);
  }

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;
  const isActiveParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  /**
   * Igual que fetchPage en useUsersQuery: pide una página específica
   * bajo los MISMOS filtros que la consulta en vivo. La usa useExport
   * cuando una selección abarca varias páginas.
   */
  const fetchPage = useCallback(
    async (pageNumber: number, limit: number) => {
      const response = await candidatesService.getList({
        page: pageNumber,
        limit,
        search: debouncedSearch || undefined,
        status: statusParam,
        isActive: isActiveParam,
      });
      return response.items;
    },
    [debouncedSearch, statusParam, isActiveParam],
  );

  const query = useQuery({
    queryKey: [
      'candidates',
      'list',
      { search: debouncedSearch, page, limit: pageSize, status: statusParam, isActive: isActiveParam },
    ],
    queryFn: () =>
      candidatesService.getList({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
        isActive: isActiveParam,
      }),
    placeholderData: keepPreviousData,
  });

  return {
    candidates: query.data?.items ?? [],
    totalResults: query.data?.pagination.total ?? 0,
    totalPages: query.data?.pagination.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    search: searchInput,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeFilter,
    setActiveFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchPage,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/table';
import type { CandidateListItem, CandidateStatus } from '../types/candidate.types';
import { candidatesService } from '../services/candidateService';

export function useCandidatesList() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearchState] = useState('');
  const [statusFilter, setStatusFilterState] = useState<CandidateStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  // Función orquestadora: dispara la petición a la API
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await candidatesService.getList({
        page,
        limit: pageSize,
        search: search.trim() !== '' ? search : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setCandidates(response.items);
      setTotalResults(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  // Ejecutar búsqueda cada vez que cambia un parámetro
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Se mantiene async para las exportaciones masivas
  const fetchPage = useCallback(
    async (pageNumber: number, limit: number): Promise<CandidateListItem[]> => {
      const response = await candidatesService.getList({
        page: pageNumber,
        limit,
        search: search.trim() !== '' ? search : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      return response.items;
    },
    [search, statusFilter],
  );

  return {
    candidates,
    totalResults,
    isLoading,
    search,
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1); // Reset a página 1 al buscar
    },
    statusFilter,
    setStatusFilter: (value: CandidateStatus | 'all') => {
      setStatusFilterState(value);
      setPage(1); // Reset a página 1 al filtrar
    },
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize: (value: number) => {
      setPageSizeState(value);
      setPage(1);
    },
    fetchPage,
  };
}
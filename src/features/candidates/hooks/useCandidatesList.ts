import { useEffect, useMemo, useState } from 'react';
import { candidatesMock } from '../services/candidates.mock';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/table';
import type { CandidateListItem, CandidateStatus } from '../types/candidate.types';

/**
 * Búsqueda, filtro y paginación se resuelven aquí, en memoria, porque hoy
 * los datos son mock. Cuando exista `GET /candidates?search=&status=&page=&limit=`,
 * este es el único archivo que cambia: en vez de filtrar el arreglo local,
 * se le pasan esos mismos parámetros al servicio real. La tabla y la
 * página no necesitan cambiar.
 */
export function useCandidatesList() {
  const [allCandidates, setAllCandidates] = useState<CandidateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearchState] = useState('');
  const [statusFilter, setStatusFilterState] = useState<CandidateStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    candidatesMock.getList().then((data) => {
      setAllCandidates(data);
      setIsLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return allCandidates.filter((c) => {
      const matchesSearch =
        search.trim() === '' ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.positionApplied.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allCandidates, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    candidates: paginated,
    totalResults: filtered.length,
    isLoading,
    search,
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (value: CandidateStatus | 'all') => {
      setStatusFilterState(value);
      setPage(1);
    },
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize: (value: number) => {
      setPageSizeState(value);
      setPage(1);
    },
  };
}

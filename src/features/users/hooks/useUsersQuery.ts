import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersService } from '../services/usersService';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Orquesta el listado de Users contra la API real.
 *
 * `searchInput` es lo que el usuario escribe (responde a cada tecla en
 * el TextField); `debouncedSearch` es lo que realmente dispara la
 * petición al backend, con 400ms de espera. Sin este debounce, cada
 * tecla generaría un GET /users — un problema real ahora que la
 * búsqueda pega contra la API, no una optimización especulativa.
 */
export function useUsersQuery() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['users', 'list', { search: debouncedSearch, page, limit: PAGE_SIZE }],
    queryFn: () =>
      usersService.getList({
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    // Mantiene los datos de la página anterior visibles mientras carga
    // la siguiente, en vez de mostrar un loading en blanco al paginar.
    placeholderData: keepPreviousData,
  });

  return {
    users: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    searchInput,
    setSearchInput,
    page,
    setPage,
  };
}

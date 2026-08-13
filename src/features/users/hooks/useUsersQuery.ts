import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersService } from '../services/usersService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserRole } from '@/features/auth/types/role.enum';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/table';
import type { User } from '../types/user.types';

const SEARCH_DEBOUNCE_MS = 400;

export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type UserRoleFilter = UserRole | 'all';

/**
 * Ordena por estado DENTRO de cada página recibida. NO logra "todos los
 * activos primero en todas las páginas" — eso solo puede garantizarse
 * con un `orderBy` en el backend (Prisma), porque el frontend nunca
 * tiene el dataset completo cargado a la vez. Se deja como un
 * ordenamiento cosmético de la página actual mientras el backend no lo
 * resuelva; es inofensivo una vez que el backend sí ordene (reordenar
 * una lista ya ordenada no cambia nada).
 *
 * ── CONTRATO ESPERADO DEL BACKEND (pendiente, lo implementa el equipo
 *    de backend en UsersService.findAll) ──────────────────────────────
 * `UsersService.findAll()` debería ordenar con Prisma:
 *   orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
 * (o el criterio secundario que prefieran). Una vez que exista, esta
 * función y su llamada de abajo pueden eliminarse por completo — no
 * queremos mantener el mismo ordenamiento duplicado en dos capas.
 * ───────────────────────────────────────────────────────────────────
 */
function sortActiveFirst(users: User[]): User[] {
  return [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive));
}

/**
 * Orquesta el listado de Users contra la API real, incluyendo los
 * filtros de estado/rol que ya soporta UserQueryDto en el backend
 * (`isActive`, `role`) — se envían tal cual, no se simulan en memoria.
 */
export function useUsersQuery() {
  const { user: currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [roleFilter, setRoleFilterState] = useState<UserRoleFilter>('all');
  const [statusFilter, setStatusFilterState] = useState<UserStatusFilter>('all');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  function setRoleFilter(value: UserRoleFilter) {
    setRoleFilterState(value);
    setPage(1);
  }

  function setStatusFilter(value: UserStatusFilter) {
    setStatusFilterState(value);
    setPage(1);
  }

  function setPageSize(value: number) {
    setPageSizeState(value);
    setPage(1);
  }

  const roleParam = roleFilter === 'all' ? undefined : roleFilter;
  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active';

  /**
   * Pide una página específica bajo los MISMOS filtros que la consulta
   * en vivo (mismo `debouncedSearch`/`roleParam`/`isActiveParam`, y la
   * misma exclusión del usuario autenticado que ya aplica más abajo).
   * Existe para la exportación (useExport): cuando hay una selección que
   * abarca varias páginas, es la forma de reunir todos los registros
   * sin duplicar la lógica de filtros en otro archivo.
   */
  const fetchPage = useCallback(
    async (pageNumber: number, limit: number): Promise<User[]> => {
      const response = await usersService.getList({
        search: debouncedSearch || undefined,
        page: pageNumber,
        limit,
        role: roleParam,
        isActive: isActiveParam,
      });
      return response.items.filter((item) => item.id !== currentUser?.id);
    },
    [debouncedSearch, roleParam, isActiveParam, currentUser?.id],
  );

  const query = useQuery({
    queryKey: [
      'users',
      'list',
      { search: debouncedSearch, page, limit: pageSize, role: roleParam, isActive: isActiveParam },
    ],
    queryFn: () =>
      usersService.getList({
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
        role: roleParam,
        isActive: isActiveParam,
      }),
    // Mantiene los datos de la página anterior visibles mientras carga
    // la siguiente, en vez de mostrar un loading en blanco al paginar.
    placeholderData: keepPreviousData,
  });

  // El usuario autenticado administrará su propia información desde
  // "Mi Perfil" (fase futura): nunca debe verse a sí mismo en este
  // listado general. A diferencia del filtro de SYSTEM (regla de datos
  // pura, vive en usersService), esta exclusión depende de la sesión
  // activa — por eso vive aquí, en el hook, que sí tiene acceso a
  // useAuth(). usersService no debe conocer el contexto de React.
  const visibleItems = (query.data?.items ?? []).filter(
    (item) => item.id !== currentUser?.id,
  );

  const sortedItems = sortActiveFirst(visibleItems);

  return {
    users: sortedItems,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    fetchPage,
  };
}

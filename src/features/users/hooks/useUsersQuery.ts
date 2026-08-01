import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersService } from '../services/usersService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserRole } from '@/features/auth/types/role.enum';
import type { User } from '../types/user.types';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type UserRoleFilter = UserRole | 'all';

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

  const roleParam = roleFilter === 'all' ? undefined : roleFilter;
  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const query = useQuery({
    queryKey: [
      'users',
      'list',
      { search: debouncedSearch, page, limit: PAGE_SIZE, role: roleParam, isActive: isActiveParam },
    ],
    queryFn: () =>
      usersService.getList({
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
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
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  };
}

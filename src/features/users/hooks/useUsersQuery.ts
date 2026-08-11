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

function sortActiveFirst(users: User[]): User[] {
  return [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive));
}

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

    placeholderData: keepPreviousData,
  });

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

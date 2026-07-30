import { apiClient } from '@/lib/http/apiClient';
import type { PaginatedResponse } from '@/shared/types/pagination';
import type { User, UserListQuery } from '../types/user.types';

interface UsersApiResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersService = {
  async getList(query: UserListQuery): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<UsersApiResponse>('/users', {
      params: query,
    });

    return {
      items: data.data,
      pagination: {
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      },
    };
  },
};
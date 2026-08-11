import { apiClient } from '@/lib/http/apiClient';
import type { PaginatedResponse } from '@/shared/types/pagination';
import { UserRole } from '@/features/auth/types/role.enum';
import type {
  CreateUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  User,
  UserListQuery,
} from '../types/user.types';

/**
 * Forma real que hoy devuelve GET /users: `data` + `meta`, no
 * `items` + `pagination`. Este servicio es el único lugar que conoce
 * esa diferencia y la traduce al contrato interno de la app
 * (PaginatedResponse<T>). Si el backend adopta items/pagination más
 * adelante, este es el único archivo que cambia.
 */
interface RawUsersListResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersService = {
  async getList(query: UserListQuery): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<RawUsersListResponse>('/users', { params: query });
    
    const items = data.data.filter((user) => user.role !== UserRole.SYSTEM);

    return {
      items,
      pagination: data.meta,
    };
  },

  async create(payload: CreateUserRequest): Promise<User> {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  async update(id: string, payload: UpdateUserRequest): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, payload: UpdateUserStatusRequest): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}/status`, payload);
    return data;
  },

  async updatePassword(id: string, payload: UpdateUserPasswordRequest): Promise<void> {
    await apiClient.patch(`/users/${id}/password`, payload);
  },
};

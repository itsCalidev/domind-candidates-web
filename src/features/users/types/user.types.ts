import type { UserRole } from '@/features/auth/types/role.enum';

/**
 * Modelo de usuario tal como lo devuelve el backend. Sin `password` —
 * el backend nunca lo incluye en ninguna respuesta.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query params de GET /users, tal cual UserQueryDto del backend.
 */
export interface UserListQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

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

/** Body de POST /users. */
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

/** Body de PUT /users/:id. No incluye password ni role: ese endpoint no los acepta. */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

/** Body de PATCH /users/:id/status. */
export interface UpdateUserStatusRequest {
  isActive: boolean;
}

/** Body de PATCH /users/:id/password. Cambio administrativo: sin contraseña anterior. */
export interface UpdateUserPasswordRequest {
  password: string;
}

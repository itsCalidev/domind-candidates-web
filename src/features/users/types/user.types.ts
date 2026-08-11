import { UserRole } from '@/features/auth/types/role.enum';

/**
 * Modelo de usuario lo devuelve el backend.
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
  mustChangePassword?: boolean;
}

export interface UserListQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

/** Body de PATCH /users/:id. No incluye password ni role: ese endpoint no los acepta. */
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

export const VISIBLE_USER_ROLES = Object.values(UserRole).filter(
  (role) => role !== UserRole.SYSTEM,
);

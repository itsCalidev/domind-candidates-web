import { UserRole } from '@/features/auth/types/role.enum';

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
  /**
   * Preparado para el flujo de contraseña temporal (ver
   * AuthContext/JwtPayload). El backend todavía no lo incluye; hasta
   * entonces siempre llega `undefined` y no dispara ninguna lógica.
   */
  mustChangePassword?: boolean;
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

/**
 * Body de POST /users. Ya NO incluye `password`: el backend generará
 * una contraseña temporal para el usuario nuevo (ver `mustChangePassword`
 * en User/JwtPayload, preparado para cuando ese flujo exista).
 */
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

/**
 * Roles seleccionables desde la UI de Users (formulario de creación,
 * filtro de rol). SYSTEM se excluye siempre: es un usuario técnico, no
 * debe crearse ni filtrarse desde aquí.
 * TODO(temporal): mover esta exclusión al backend cuando exista un
 * filtro real (ver también el TODO en usersService.getList).
 */
export const VISIBLE_USER_ROLES = Object.values(UserRole).filter(
  (role) => role !== UserRole.SYSTEM,
);

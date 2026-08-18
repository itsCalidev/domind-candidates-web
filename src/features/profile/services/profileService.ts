import { apiClient } from '@/lib/http/apiClient';
import type { UpdateUserPasswordRequest } from '@/features/users/types/user.types';
import type { UpdateMyProfileRequest } from '../types/profile.types';

/**
 * Endpoints "yo mismo": a diferencia de /users/:id (administrativo),
 * estos actúan sobre el usuario del token, sin pasar ningún id en la
 * URL. Existen específicamente para que RECRUITER (y cualquier rol) se
 * autogestione sin depender de permisos pensados para administradores.
 *
 * NOTA (verificado en vivo, 2026-08-17): PATCH /users/me/password hoy
 * responde 500 para SYSTEM/ADMIN y 403 para RECRUITER — no funciona
 * para ningún rol todavía. Se implementa igual porque es el contrato
 * correcto a futuro; el bug es del backend, reportado aparte.
 */
export const profileService = {
  /** PATCH /users/me/profile. Reutiliza UpdateUserDto (mismo que /users/:id) sin email. */
  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
    await apiClient.patch('/users/me/profile', payload);
  },

  /** PATCH /users/me/password. Mismo UpdatePasswordDto que /users/:id/password. */
  async updateMyPassword(payload: UpdateUserPasswordRequest): Promise<void> {
    await apiClient.patch('/users/me/password', payload);
  },
};

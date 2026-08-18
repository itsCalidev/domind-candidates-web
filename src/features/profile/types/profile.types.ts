/**
 * Body de PATCH /users/me/profile (UpdateUserDto, el mismo DTO que
 * PATCH /users/:id, pero sin `email` — este endpoint es exclusivamente
 * para que el propio usuario edite su nombre/apellido; el correo lo
 * sigue manejando el flujo administrativo).
 */
export interface UpdateMyProfileRequest {
  firstName: string;
  lastName: string;
}

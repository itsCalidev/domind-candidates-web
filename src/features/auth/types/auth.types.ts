import type { UserRole } from './role.enum';

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Forma real de la respuesta de POST /auth/login (verificada en vivo).
 * El backend NO devuelve un objeto `user`: tokens + `mustChangePassword`.
 * Los nombres de propiedad de los tokens (`access_token`, `refresh_token`)
 * se mantienen tal cual los entrega la API, sin renombrar a camelCase,
 * para no introducir un mapeo que pueda desincronizarse del contrato real.
 *
 * `mustChangePassword` es un campo nuevo, hermano de los tokens — NO
 * viene embebido en el JWT (se decodificó el payload real y no aparece
 * ahí), así que solo se conoce en el instante del login. AuthContext lo
 * persiste aparte (sessionStorage) para sobrevivir a un F5 mientras el
 * usuario sigue atrapado en /change-password.
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  mustChangePassword: boolean;
}

/**
 * Payload del Access Token JWT. El frontend lo decodifica (sin verificar
 * firma, eso es responsabilidad exclusiva del backend) únicamente para
 * obtener datos de presentación (id, correo, rol) sin pedirlos a un
 * endpoint aparte. `mustChangePassword` NO vive aquí — confirmado en
 * vivo que el JWT no lo incluye; viaja solo en LoginResponse.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/** Usuario autenticado tal como lo consume el resto de la aplicación. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Body de POST /auth/logout. A diferencia de la respuesta de login
 * (snake_case), este endpoint espera camelCase — se respeta tal cual,
 * sin normalizar ambos a un mismo estilo.
 */
export interface LogoutRequest {
  refreshToken: string;
}

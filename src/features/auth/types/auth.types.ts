import type { UserRole } from './role.enum';

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Forma real de la respuesta de POST /auth/login.
 * El backend NO devuelve un objeto `user`: solo los tokens. Los nombres
 * de propiedad (`access_token`, `refresh_token`) se mantienen tal cual
 * los entrega la API, sin renombrar a camelCase, para no introducir un
 * mapeo que pueda desincronizarse del contrato real.
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Payload del Access Token JWT. El frontend lo decodifica (sin verificar
 * firma, eso es responsabilidad exclusiva del backend) únicamente para
 * obtener datos de presentación (id, correo, rol) sin pedirlos a un
 * endpoint aparte.
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

const ACCESS_TOKEN_KEY = 'domind_access_token';
const REFRESH_TOKEN_KEY = 'domind_refresh_token';

/**
 * Acceso crudo a los tokens en sessionStorage.
 *
 * Vive en `lib/http` (no en `features/auth`) a propósito: `apiClient`
 * necesita leer el access token para adjuntarlo en cada request, y `lib/`
 * debe seguir siendo agnóstico de dominio, no al revés. La lógica de
 * "qué es una sesión" (decodificar el usuario, expiración, etc.) vive en
 * `features/auth/context/AuthContext.tsx`, que sí importa de aquí.
 */
export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

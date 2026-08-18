import axios from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokenStorage';

/**
 * Disparado en `window` cuando el refresh token deja de servir (el propio
 * POST /auth/refresh responde 401, o no hay refresh token guardado).
 * AuthContext escucha este evento para limpiar su estado de React — vive
 * como evento de `window` y no como una llamada directa porque este
 * módulo corre fuera del árbol de React y no tiene otra forma de avisarle
 * a un componente que la sesión murió.
 */
export const SESSION_EXPIRED_EVENT = 'domind:session-expired';

/**
 * Respuesta real de POST /auth/refresh: el backend implementa "refresh
 * token rotation", así que devuelve un access_token Y un refresh_token
 * nuevos (mismo naming snake_case que POST /auth/login, ya verificado).
 */
interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Cliente axios independiente de `apiClient`, exclusivo para
 * POST /auth/refresh. Si reutilizáramos `apiClient`, su propio
 * interceptor de respuesta (ver apiClient.ts) volvería a pasar por aquí
 * ante un 401 de esta misma llamada. Usar una instancia aparte elimina
 * ese ciclo de raíz en vez de defenderse con banderas.
 */
const refreshClient = axios.create({ baseURL: env.apiBaseUrl });

let inFlightRefresh: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await refreshClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    tokenStorage.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    return false;
  }
}

/**
 * Renueva access/refresh token. Deduplicada a propósito: si varias
 * peticiones reciben 401 al mismo tiempo, o el timer proactivo de
 * AuthContext coincide con una de ellas, todas comparten esta misma
 * promesa en vez de disparar N llamadas a /auth/refresh en paralelo.
 */
export function refreshSession(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

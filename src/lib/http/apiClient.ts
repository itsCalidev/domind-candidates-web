import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokenStorage';
import { refreshSession } from './refreshSession';

/**
 * Instancia central de axios para toda la aplicación.
 *
 * El interceptor de respuesta es la "red de seguridad" de sesión: ante un
 * 401, intenta renovar el token (ver refreshSession.ts, que dedupe
 * llamadas concurrentes a /auth/refresh) y reintenta la petición original
 * una sola vez con el token nuevo. Tres cosas evitan que esto se
 * convierta en un bucle infinito:
 * - `_retry` marca la petición ya reintentada: si el token nuevo TAMBIÉN
 *   recibe 401, se deja pasar como error real en vez de reintentar de
 *   nuevo.
 * - `/auth/login`, `/auth/refresh` y `/auth/logout` nunca entran a este
 *   flujo: un 401 ahí es credenciales o refresh token inválidos, no una
 *   sesión caducada — intentar "refrescar" un refresh fallido es
 *   exactamente el ciclo que hay que impedir.
 * - `refreshSession()` está deduplicada, así que N peticiones fallando a
 *   la vez disparan una sola llamada real a /auth/refresh.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const AUTH_ENDPOINTS_WITHOUT_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isAuthEndpoint(url?: string): boolean {
  return !!url && AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => url.includes(path));
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Marcarla ANTES de refrescar: si dos respuestas 401 llegan para la
    // misma petición reintentada (no debería pasar, pero por si acaso),
    // la segunda vuelta ya no vuelve a intentar nada.
    originalRequest._retry = true;

    const refreshed = await refreshSession();
    if (!refreshed) {
      return Promise.reject(error);
    }

    const newAccessToken = tokenStorage.getAccessToken();
    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }

    return apiClient(originalRequest);
  },
);

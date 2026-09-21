import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokenStorage';
import { magicLinkStorage } from './magicLinkStorage';
import { refreshSession } from './refreshSession';

/**
 * Disparado en `window` cuando una petición que llevaba el header
 * `x-magic-link` responde 401/403 — el token ya no sirve (caducó, se
 * quemó al hacer submit-form, o es inválido). `MagicLinkContext` escucha
 * este evento para limpiar su estado de React, igual que `AuthContext`
 * hace con `SESSION_EXPIRED_EVENT` (ver refreshSession.ts): este módulo
 * corre fuera del árbol de React y no tiene otra forma de avisarle a un
 * componente. Se dispara desde aquí (no desde un módulo aparte tipo
 * refreshSession.ts) porque, a diferencia del JWT, un token mágico no se
 * "refresca" — no hay una llamada de red que aislar, solo limpiar y avisar.
 */
export const MAGIC_LINK_INVALID_EVENT = 'domind:magic-link-invalid';

const MAGIC_LINK_HEADER = 'x-magic-link';

/**
 * Endpoints "secundarios" del flujo de candidato: su 401/403 no prueba
 * que el enlace mágico en sí esté inválido, solo que ESA petición puntual
 * falló (ej. una carga de evidencia que se dispara en segundo plano para
 * el validador de completitud). Tumbar toda la sesión del candidato por
 * esto lo saca del Wizard sin motivo — el caller (ej. `useGetEvidence`,
 * vía `isError`) ya sabe manejar el fallo de su propia petición sin que
 * `apiClient` tenga que reaccionar de forma global. Cualquier otro
 * endpoint (los PATCH de cada paso, `submit-form`, y por supuesto
 * `/candidates/magic-link/validate`) se sigue tratando como rechazo
 * estructural: si el backend responde 401/403 ahí, el token realmente ya
 * no sirve.
 */
const MAGIC_LINK_SECONDARY_ENDPOINTS = ['/evidence'];

function isSecondaryMagicLinkEndpoint(url?: string): boolean {
  return !!url && MAGIC_LINK_SECONDARY_ENDPOINTS.some((path) => url.includes(path));
}

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
 *
 * Las peticiones con `x-magic-link` tienen su propia rama, antes de
 * llegar a toda esta lógica de JWT — ver más abajo.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Prioridad cuando existen AMBOS credenciales en la misma pestaña: gana
 * el Magic Link. `sessionStorage` sobrevive entre navegaciones internas
 * de la SPA, así que un caso raro pero real es visitar un magic link y,
 * en esa misma pestaña, tener también un JWT de una sesión de reclutador
 * (propia o de quien usó el navegador antes). Un token mágico presente
 * significa que la UI está activamente en modo candidato — nunca se debe
 * mandar en su lugar un JWT potencialmente ajeno u obsoleto. Nunca se
 * mandan los dos headers a la vez: cada ruta híbrida espera uno u otro,
 * no ambos.
 */
apiClient.interceptors.request.use((config) => {
  const magicLinkToken = magicLinkStorage.get();
  if (magicLinkToken) {
    config.headers[MAGIC_LINK_HEADER] = magicLinkToken;
    return config;
  }

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
    const status = error.response?.status;

    // Petición de Magic Link inválida/caducada: nunca debe caer en el
    // flujo de refresh de JWT de abajo (un token mágico no se
    // "refresca"). Un 401/403 en un endpoint secundario (ver
    // MAGIC_LINK_SECONDARY_ENDPOINTS) se deja pasar tal cual al caller,
    // sin tocar el storage ni el estado global — solo un rechazo
    // estructural limpia el token y avisa por evento.
    if (originalRequest?.headers?.[MAGIC_LINK_HEADER] && (status === 401 || status === 403)) {
      if (isSecondaryMagicLinkEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }
      magicLinkStorage.remove();
      window.dispatchEvent(new Event(MAGIC_LINK_INVALID_EVENT));
      return Promise.reject(error);
    }

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
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

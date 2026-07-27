import axios from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from './tokenStorage';

/**
 * Instancia central de axios para toda la aplicación.
 *
 * Incluye un interceptor mínimo que adjunta el Access Token si existe.
 * Deliberadamente NO incluye:
 * - Reintento automático ante 401
 * - Renovación silenciosa (refresh) de sesión
 * - Cola de peticiones fallidas
 * Esa lógica pertenece a una fase posterior, cuando implementemos
 * refresh automático.
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

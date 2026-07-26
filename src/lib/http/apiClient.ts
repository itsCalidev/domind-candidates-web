import axios from 'axios';
import { env } from '@/config/env';

/**
 * Instancia central de axios para toda la aplicación.
 *
 * Deliberadamente NO incluye todavía:
 * - Interceptor de Authorization header (Access Token)
 * - Interceptor de refresh automático ante 401
 *
 * Esa lógica pertenece al módulo de autenticación (Fase 2) y no debe
 * vivir en `lib/`, que es agnóstico de dominio.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

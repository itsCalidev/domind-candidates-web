import { apiClient } from '@/lib/http/apiClient';
import type { LoginRequest, LoginResponse, LogoutRequest } from '../types/auth.types';

/**
 * Capa de acceso a la API de autenticación. Ningún componente llama a
 * axios/apiClient directamente: siempre pasan por aquí.
 */
export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async logout(payload: LogoutRequest): Promise<void> {
    await apiClient.post('/auth/logout', payload);
  },
};

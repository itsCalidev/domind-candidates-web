import { apiClient } from '@/lib/http/apiClient';
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
} from '../types/auth.types';

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      payload,
    );

    return data;
  },

  async logout(payload: LogoutRequest): Promise<void> {
    await apiClient.post('/auth/logout', payload);
  },
};
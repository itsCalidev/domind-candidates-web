import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '@/lib/http/tokenStorage';
import { decodeJwtPayload } from '@/shared/utils/jwt';
import type { AuthenticatedUser, JwtPayload } from '../types/auth.types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  /** Carga inicial: sigue en true mientras se revisa si hay sesión guardada. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}

function userFromToken(accessToken: string): AuthenticatedUser | null {
  const payload = decodeJwtPayload<JwtPayload>(accessToken);
  if (!payload || isExpired(payload)) return null;

  return { id: payload.sub, email: payload.email, role: payload.role };
}

/**
 * Fuente única de verdad del usuario autenticado para toda la app.
 *
 * No navega por sí mismo: expone estado y acciones; el componente que
 * invoca `login`/`logout` decide a dónde redirigir. Esto mantiene el
 * contexto testeable sin acoplarlo a React Router.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recupera la sesión guardada al cargar/recargar la página.
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      const restoredUser = userFromToken(accessToken);
      if (restoredUser) {
        setUser(restoredUser);
      } else {
        tokenStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { access_token, refresh_token } = await authService.login({ email, password });
    tokenStorage.setTokens(access_token, refresh_token);
    setUser(userFromToken(access_token));
  }

  async function logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      // La sesión local se limpia aunque la llamada al backend falle
      // (ej. red caída): el usuario debe poder salir de todos modos.
      tokenStorage.clear();
      setUser(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

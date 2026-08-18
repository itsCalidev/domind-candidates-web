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
import { refreshSession, SESSION_EXPIRED_EVENT } from '@/lib/http/refreshSession';
import { decodeJwtPayload } from '@/shared/utils/jwt';
import { useAccessibility } from '@/shared/context/AccessibilityContext';
import type { AuthenticatedUser, JwtPayload } from '../types/auth.types';

const MUST_CHANGE_PASSWORD_KEY = 'domind_must_change_password';

/** Renovación proactiva: el access token dura 15 min, se renueva a los 13. */
const PROACTIVE_REFRESH_INTERVAL_MS = 13 * 60 * 1000;
/** Sin actividad del usuario durante 15 min → cierre de sesión automático. */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const IDLE_ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const;
/**
 * `mousemove` dispara decenas de eventos por segundo; sin este throttle,
 * cada uno reprogramaría el setTimeout de inactividad innecesariamente.
 */
const IDLE_ACTIVITY_THROTTLE_MS = 1000;

/**
 * `mustChangePassword` no vive en el JWT (ver auth.types.ts), así que no
 * sobrevive a un F5 solo con `userFromToken`. Se persiste en
 * sessionStorage igual que los tokens, pero vive aquí (no en
 * lib/http/tokenStorage) porque es un concepto de sesión de auth, no
 * algo que apiClient necesite leer para adjuntar headers.
 */
function readMustChangePassword(): boolean {
  return sessionStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true';
}

function writeMustChangePassword(value: boolean): void {
  if (value) {
    sessionStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true');
  } else {
    sessionStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
  }
}

/**
 * Por qué terminó la sesión sin que el usuario diera clic en "Cerrar
 * sesión": `SessionGuard` lo lee para decidir qué toast mostrar antes de
 * redirigir a /login. `null` significa "no terminó por ninguna de estas
 * dos razones" (login normal, logout manual, o simplemente no hay sesión).
 */
type SessionEndReason = 'idle' | 'expired' | null;

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  /** Carga inicial: sigue en true mientras se revisa si hay sesión guardada. */
  isLoading: boolean;
  /**
   * true cuando el backend exigió cambiar la contraseña en este login.
   * ProtectedRoute redirige a /change-password mientras esto sea true;
   * RequirePasswordChangeRoute exige exactamente lo contrario.
   */
  mustChangePassword: boolean;
  /** Devuelve `mustChangePassword` para que el llamador decida a dónde navegar. */
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Llamar tras un PATCH /users/:id/password exitoso: libera la navegación. */
  markPasswordChanged: () => void;
  sessionEndReason: SessionEndReason;
  /** `SessionGuard` la llama después de mostrar el toast, para no repetirlo. */
  clearSessionEndReason: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}

function userFromToken(accessToken: string): AuthenticatedUser | null {
  const payload = decodeJwtPayload<JwtPayload>(accessToken);
  if (!payload || isExpired(payload)) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
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
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null);
  const isAuthenticated = user !== null;
  // AccessibilityProvider envuelve a AuthProvider (ver App.tsx), así que
  // este hook SÍ es legal aquí: se está consumiendo un contexto ancestro,
  // no uno hermano o descendiente. Se usa para que /login nunca herede el
  // modo oscuro/tamaño de letra de la sesión que se acaba de cerrar.
  const { resetAll: resetAccessibilityPreferences } = useAccessibility();

  // Recupera la sesión guardada al cargar/recargar la página.
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      const restoredUser = userFromToken(accessToken);
      if (restoredUser) {
        setUser(restoredUser);
        setMustChangePassword(readMustChangePassword());
      } else {
        tokenStorage.clear();
        writeMustChangePassword(false);
      }
    }
    setIsLoading(false);
  }, []);

  // Capa 1 (parte reactiva): apiClient.ts dispara este evento cuando
  // POST /auth/refresh falla de forma irrecuperable (401 o sin refresh
  // token guardado). Ese módulo vive fuera de React y ya limpió
  // tokenStorage — aquí solo se sincroniza el estado del contexto.
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setMustChangePassword(false);
      setSessionEndReason('expired');
      resetAccessibilityPreferences();
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [resetAccessibilityPreferences]);

  async function login(email: string, password: string): Promise<boolean> {
    const {
      access_token,
      refresh_token,
      mustChangePassword: mustChange,
    } = await authService.login({ email, password });
    tokenStorage.setTokens(access_token, refresh_token);
    writeMustChangePassword(mustChange);
    setUser(userFromToken(access_token));
    setMustChangePassword(mustChange);
    return mustChange;
  }

  async function logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } finally {
      // La sesión local se limpia aunque la llamada al backend falle
      // (ej. red caída): el usuario debe poder salir de todos modos.
      tokenStorage.clear();
      writeMustChangePassword(false);
      setUser(null);
      setMustChangePassword(false);
      // Único punto de logout manual; handleIdleLogout (más abajo) llama
      // a esta misma función, así que cierre por inactividad también
      // queda cubierto sin duplicar la llamada.
      resetAccessibilityPreferences();
    }
  }

  function markPasswordChanged() {
    writeMustChangePassword(false);
    setMustChangePassword(false);
  }

  function clearSessionEndReason() {
    setSessionEndReason(null);
  }

  // Capas 2 y 3: renovación proactiva e inactividad. Ambas solo tienen
  // sentido con sesión activa, así que comparten un único efecto atado a
  // `isAuthenticated` — un booleano estable entre renders, a diferencia
  // de `user` (que cambia de referencia en cada renovación de token y
  // reiniciaría el timer de inactividad sin motivo si fuera la dependencia).
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshTimer = setInterval(() => {
      void refreshSession().then((refreshed) => {
        if (!refreshed) return;
        const accessToken = tokenStorage.getAccessToken();
        setUser(accessToken ? userFromToken(accessToken) : null);
      });
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    let idleTimer: ReturnType<typeof setTimeout>;
    let lastActivityAt = 0;

    async function handleIdleLogout() {
      await logout();
      setSessionEndReason('idle');
    }

    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void handleIdleLogout(), IDLE_TIMEOUT_MS);
    }

    function handleActivity() {
      const now = Date.now();
      if (now - lastActivityAt < IDLE_ACTIVITY_THROTTLE_MS) return;
      lastActivityAt = now;
      resetIdleTimer();
    }

    resetIdleTimer();
    IDLE_ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      clearInterval(refreshTimer);
      clearTimeout(idleTimer);
      IDLE_ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      mustChangePassword,
      login,
      logout,
      markPasswordChanged,
      sessionEndReason,
      clearSessionEndReason,
    }),
    [user, isAuthenticated, isLoading, mustChangePassword, sessionEndReason],
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

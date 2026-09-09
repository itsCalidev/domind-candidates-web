import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { apiClient, MAGIC_LINK_INVALID_EVENT } from '@/lib/http/apiClient';
import { magicLinkStorage } from '@/lib/http/magicLinkStorage';
import { useToast } from '@/shared/context/ToastContext';

/**
 * Respuesta de GET /candidates/magic-link/validate — contrato dado
 * directamente por el usuario en el chat, no documentado en /docs-json.
 */
interface MagicLinkCandidate {
  candidateId: string;
  folio: string;
  firstName: string;
  lastName: string;
}

interface MagicLinkContextValue {
  isCandidateMode: boolean;
  candidate: MagicLinkCandidate | null;
  /** true mientras se resuelve GET /candidates/magic-link/validate. */
  isValidating: boolean;
  /**
   * Pide GET /candidates/magic-link/validate?token=... — si es válido,
   * guarda el token (magicLinkStorage) y activa el modo candidato.
   * Devuelve true/false en vez de navegar: la página que capture
   * /candidate-form/:token (todavía sin construir) decide a dónde ir con
   * el resultado, igual que AuthContext.login() con `mustChangePassword`.
   */
  validateToken: (token: string) => Promise<boolean>;
  /** Limpia el modo candidato — tras un submit-form exitoso (el token ya se quemó en el backend) o para salir manualmente del flujo. */
  clearMagicLink: () => void;
}

const MagicLinkContext = createContext<MagicLinkContextValue | null>(null);

/**
 * Regla estricta pedida por el usuario: nunca mostrar errores crudos del
 * servidor al candidato. Dos mensajes genéricos nada más — cuál se
 * muestra depende de si el problema es "el enlace no sirve" (401/403/404
 * de validate, o el evento que dispara apiClient en cualquier petición
 * posterior) o cualquier otra falla (red, 500).
 */
const INVALID_LINK_MESSAGE = 'Tu enlace de acceso no es válido o ya expiró.';
const GENERIC_ERROR_MESSAGE = 'Ocurrió un problema de conexión. Intenta de nuevo más tarde.';

/**
 * Igual que AuthContext: no navega por sí mismo, solo expone estado y
 * acciones. Vive en su propia feature (`candidate-auth`, no `auth`)
 * porque es una identidad completamente distinta a la sesión JWT de
 * reclutador — comparten `apiClient` pero no comparten Context ni
 * storage.
 */
export function MagicLinkProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<MagicLinkCandidate | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const isCandidateMode = candidate !== null;

  // apiClient.ts dispara esto cuando una petición con `x-magic-link`
  // responde 401/403 (token caducado, ya quemado por submit-form, o
  // inválido a medio flujo) — ese módulo corre fuera de React, así que
  // avisa por evento de `window`, igual que SESSION_EXPIRED_EVENT en
  // AuthContext.
  useEffect(() => {
    function handleMagicLinkInvalid() {
      setCandidate(null);
      showToast(INVALID_LINK_MESSAGE, 'error');
    }
    window.addEventListener(MAGIC_LINK_INVALID_EVENT, handleMagicLinkInvalid);
    return () => window.removeEventListener(MAGIC_LINK_INVALID_EVENT, handleMagicLinkInvalid);
  }, [showToast]);

  const validateToken = useCallback(
    async (token: string): Promise<boolean> => {
      setIsValidating(true);
      try {
        const { data } = await apiClient.get<MagicLinkCandidate>('/candidates/magic-link/validate', {
          params: { token },
        });
        magicLinkStorage.set(token);
        setCandidate(data);
        return true;
      } catch (error) {
        // Nunca se muestra el error crudo del servidor — mensaje
        // genérico siempre, distinguiendo solo "enlace inválido" (401/
        // 403/404) de "cualquier otra cosa" (red, 500), sin exponer el
        // detalle real en ningún caso.
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const isInvalidLink = status === 401 || status === 403 || status === 404;
        showToast(isInvalidLink ? INVALID_LINK_MESSAGE : GENERIC_ERROR_MESSAGE, 'error');
        setCandidate(null);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [showToast],
  );

  const clearMagicLink = useCallback(() => {
    magicLinkStorage.remove();
    setCandidate(null);
  }, []);

  const value = useMemo<MagicLinkContextValue>(
    () => ({ isCandidateMode, candidate, isValidating, validateToken, clearMagicLink }),
    [isCandidateMode, candidate, isValidating, validateToken, clearMagicLink],
  );

  return <MagicLinkContext.Provider value={value}>{children}</MagicLinkContext.Provider>;
}

export function useMagicLink(): MagicLinkContextValue {
  const ctx = useContext(MagicLinkContext);
  if (!ctx) {
    throw new Error('useMagicLink debe usarse dentro de <MagicLinkProvider>');
  }
  return ctx;
}

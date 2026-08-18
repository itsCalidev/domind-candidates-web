import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { paths } from '@/routes/paths';

const SESSION_END_MESSAGE: Record<'idle' | 'expired', string> = {
  idle: 'Sesión cerrada por inactividad.',
  expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
};

/**
 * Puente entre AuthContext y la UI para los dos cierres de sesión
 * automáticos (inactividad y refresh irrecuperable). AuthContext
 * deliberadamente no navega ni muestra toasts (ver su comentario de
 * cabecera) — vive aquí, un nivel más arriba, donde sí hay Router y
 * ToastContext disponibles. Se monta una sola vez en App.tsx.
 */
export function SessionGuard() {
  const { sessionEndReason, clearSessionEndReason } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionEndReason) return;
    showToast(SESSION_END_MESSAGE[sessionEndReason], 'info');
    navigate(paths.login, { replace: true });
    clearSessionEndReason();
  }, [sessionEndReason, showToast, navigate, clearSessionEndReason]);

  return null;
}

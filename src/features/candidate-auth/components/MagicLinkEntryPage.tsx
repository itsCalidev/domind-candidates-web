import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';
import { useMagicLink } from '../context/MagicLinkContext';
import { CandidateWizard } from './CandidateWizard';

/**
 * Página capturadora de /candidato/formulario?token=... — fuera de
 * ProtectedRoute (ver AppRouter.tsx): el candidato no tiene sesión JWT,
 * solo este token temporal. Solo cubre carga/formulario; el estado
 * "enlace inválido" ya no se renderiza in-place aquí, redirige a
 * `paths.magicLinkInvalid` (ver InvalidMagicLinkPage.tsx) — así React
 * Query nunca deja un error a medio renderizar sobre esta misma ruta, y
 * el candidato aterriza en una URL de error real, no en un estado
 * transitorio de este componente.
 */
export function MagicLinkEntryPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { candidate, isValidating, validateToken, clearMagicLink } = useMagicLink();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      clearMagicLink();
      setHasChecked(true);
      return;
    }
    validateToken(token).then((ok) => {
      if (!ok) clearMagicLink();
      setHasChecked(true);
      // Borra el token de la barra de direcciones apenas se leyó y se
      // validó (falle o no) — nunca debe quedar expuesto en el historial
      // del navegador ni en un link compartido por accidente (ej. captura
      // de pantalla, "compartir URL"). `replaceState` (no `pushState`):
      // no debe crear una entrada nueva en el historial, solo limpiar la
      // actual.
      window.history.replaceState({}, document.title, window.location.pathname);
    });
    // Debe correr solo una vez, al montar con el token que trae la URL —
    // no en cada re-render, aunque validateToken/clearMagicLink sean
    // referencias estables (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!hasChecked || isValidating) {
    return <PageLoader />;
  }

  if (!candidate) {
    // El toast genérico ya lo mostró validateToken (ver MagicLinkContext).
    // `replace`: no debe quedar en el historial una entrada intermedia a
    // la que el botón "atrás" del navegador pueda volver.
    return <Navigate to={paths.magicLinkInvalid} replace />;
  }

  return <CandidateWizard />;
}

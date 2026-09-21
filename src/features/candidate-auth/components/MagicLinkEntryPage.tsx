import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '@/shared/components/PageLoader';
import { paths } from '@/routes/paths';
import { magicLinkStorage } from '@/lib/http/magicLinkStorage';
import { useMagicLink } from '../context/MagicLinkContext';
import { CandidateWizard } from './CandidateWizard';

type EntryOutcome = 'checking' | 'notFound' | 'invalid' | 'ready';

/**
 * Página capturadora de /candidato/formulario?token=... — fuera de
 * ProtectedRoute (ver AppRouter.tsx): el candidato no tiene sesión JWT,
 * solo este token temporal. Tres reglas estrictas deciden el desenlace:
 *
 * - Sin token en la URL NI en `magicLinkStorage` ("modo sigilo"): nadie
 *   sin invitación debe enterarse de que esta ruta existe, así que cae en
 *   el 404 genérico de la app (`paths.notFound`) en vez de una pantalla
 *   de "enlace expirado" que confirmaría que la ruta es real.
 * - Sin token en la URL pero SÍ en storage (recarga F5 de una sesión ya
 *   validada): se reusa ese token guardado en vez de tratarlo como "no
 *   hay token" — antes esta página llamaba `clearMagicLink()` en cuanto
 *   la URL no traía `?token=`, lo que borraba la sesión del candidato en
 *   cada F5, justo después de que el primer `history.replaceState` ya
 *   había limpiado esa URL.
 * - Token presente (de la URL o de storage) pero el backend lo rechaza:
 *   único caso que sí debe decirle al candidato "tu enlace ya no sirve"
 *   (`paths.magicLinkInvalid`).
 */
export function MagicLinkEntryPage() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const { validateToken, clearMagicLink } = useMagicLink();
  const [outcome, setOutcome] = useState<EntryOutcome>('checking');

  useEffect(() => {
    const token = urlToken ?? magicLinkStorage.get();

    if (!token) {
      setOutcome('notFound');
      return;
    }

    validateToken(token).then((ok) => {
      if (ok) {
        if (urlToken) {
          // Borra el token de la barra de direcciones apenas se validó
          // con éxito — nunca debe quedar expuesto en el historial del
          // navegador ni en un link compartido por accidente. Solo aplica
          // cuando el token vino de la URL: si vino de storage (Regla B),
          // la URL ya estaba limpia, no hay nada que reemplazar.
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setOutcome('ready');
      } else {
        clearMagicLink();
        setOutcome('invalid');
      }
    });
    // Debe correr solo una vez, al montar con el token que trae la URL —
    // no en cada re-render, aunque validateToken/clearMagicLink sean
    // referencias estables (useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  if (outcome === 'checking') {
    return <PageLoader />;
  }

  if (outcome === 'notFound') {
    return <Navigate to={paths.notFound} replace />;
  }

  if (outcome === 'invalid') {
    // El toast genérico ya lo mostró validateToken (ver MagicLinkContext).
    // `replace`: no debe quedar en el historial una entrada intermedia a
    // la que el botón "atrás" del navegador pueda volver.
    return <Navigate to={paths.magicLinkInvalid} replace />;
  }

  return <CandidateWizard />;
}

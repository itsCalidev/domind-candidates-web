import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { PageLoader } from '@/shared/components/PageLoader';
import { useMagicLink } from '../context/MagicLinkContext';
import { CandidateWizard } from './CandidateWizard';

/**
 * Página capturadora de /candidato/formulario?token=... — fuera de
 * ProtectedRoute (ver AppRouter.tsx): el candidato no tiene sesión JWT,
 * solo este token temporal. Cubre ella sola las 3 pantallas del flujo de
 * entrada (cargando / enlace inválido / formulario), sin inventar rutas
 * adicionales que no se pidieron.
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
    // El toast genérico ya lo mostró validateToken (ver MagicLinkContext) —
    // esta es la "pantalla limpia" complementaria, sin ningún detalle
    // técnico del error real.
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <ErrorOutlineOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Este enlace ya no está disponible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          Puede haber expirado o ya haberse utilizado. Contacta a tu reclutador para solicitar uno nuevo.
        </Typography>
      </Box>
    );
  }

  return <CandidateWizard />;
}

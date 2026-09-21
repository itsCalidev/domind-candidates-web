import { Box, Typography } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

/**
 * Ruta dedicada (`paths.magicLinkInvalid`) a la que MagicLinkEntryPage
 * redirige cuando el token falta, o `validateToken` lo rechaza (401/403/
 * 404) o falla por cualquier otro motivo — antes esta pantalla se
 * renderizaba in-place dentro de MagicLinkEntryPage en vez de ser una URL
 * navegable propia, así que un intento fallido dejaba a React Query
 * mostrando el error directamente sobre la misma ruta del formulario en
 * vez de una página de error real. El mensaje es siempre genérico (regla
 * estricta del flujo de candidato, ver MagicLinkContext.tsx): nunca se
 * expone el detalle técnico de por qué falló.
 */
export function InvalidMagicLinkPage() {
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

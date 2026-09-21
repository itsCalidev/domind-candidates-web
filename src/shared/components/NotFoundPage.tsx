import { Box, Typography } from '@mui/material';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';

/**
 * 404 genérico de toda la app — deliberadamente sin ninguna mención a
 * Candidates, Magic Link ni ninguna otra feature: además de ser el
 * catch-all real de rutas inexistentes, es el destino de "modo sigilo"
 * de MagicLinkEntryPage cuando alguien visita /candidato/formulario sin
 * token (ni en la URL ni en storage) — no debe insinuar que esa ruta
 * existe ni para qué sirve.
 */
export function NotFoundPage() {
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
      <SearchOffOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        Página no encontrada
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        La página que buscas no existe o fue movida.
      </Typography>
    </Box>
  );
}

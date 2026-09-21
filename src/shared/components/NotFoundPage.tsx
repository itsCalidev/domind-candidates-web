import { Box, Typography } from '@mui/material';

/**
 * 404 genérico de toda la app — deliberadamente sin ninguna mención a
 * Candidates, Magic Link ni ninguna otra feature: además de ser el
 * catch-all real de rutas inexistentes, es el destino de "modo sigilo"
 * de MagicLinkEntryPage cuando alguien visita /candidato/formulario sin
 * token (ni en la URL ni en storage) — no debe insinuar que esa ruta
 * existe ni para qué sirve.
 *
 * Usa los mismos tokens de marca que el resto de la app (nada hardcoded):
 * `primary.main` para el "404" viene del azul corporativo de
 * `theme/palette.ts`, y `variant="h1"` hereda Titillium Web vía
 * `theme/typography.ts` — el mismo criterio que ya usa el resto del
 * panel para títulos de alta jerarquía.
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
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box component="img" src="/logo/logo.png" alt="Logo de la empresa" sx={{ height: 56, width: 'auto', mb: 4 }} />

      <Typography
        variant="h1"
        color="primary.main"
        sx={{ fontSize: { xs: '5rem', sm: '7rem' }, lineHeight: 1, mb: 2 }}
      >
        404
      </Typography>

      <Typography variant="h5" sx={{ mb: 1 }}>
        Página no encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
        Lo sentimos, la página que estás buscando no existe o fue movida.
      </Typography>
    </Box>
  );
}

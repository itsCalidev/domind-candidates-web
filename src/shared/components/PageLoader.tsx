import { Box, CircularProgress } from '@mui/material';

/**
 * Fallback visual mientras se descarga el chunk de una ruta lazy-loaded.
 */
export function PageLoader() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

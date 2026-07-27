import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { LayoutProvider } from './LayoutContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * Layout compartido por todas las rutas del panel administrativo.
 *
 * Usa <Outlet /> de React Router en lugar de recibir `children`, para que
 * el router controle qué página se renderiza dentro — así este componente
 * no necesita cambiar cuando agreguemos nuevas rutas protegidas.
 *
 * Nota: este es también el punto natural donde, en una fase futura,
 * agregaremos la verificación de sesión (redirigir a /login si no hay
 * token válido) sin tener que reestructurar las rutas existentes.
 */
export function AdminLayout() {
  return (
    <LayoutProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Header />
          <Box
            component="main"
            sx={{
              flex: 1,
              p: { xs: 2.5, md: 4 },
              bgcolor: 'background.default',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </LayoutProvider>
  );
}

import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme';
import { AppRouter } from '@/routes/AppRouter';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { queryClient } from '@/lib/query/queryClient';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* Normaliza estilos base del navegador respetando el tema */}
        <CssBaseline />
        <BrowserRouter>
          {/* AuthProvider vive dentro del Router: ProtectedRoute/GuestRoute
              necesitan <Navigate /> y useNavigate, que requieren contexto
              de enrutamiento. */}
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

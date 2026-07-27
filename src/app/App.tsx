import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '@/theme';
import { AppRouter } from '@/routes/AppRouter';
import { AuthProvider } from '@/features/auth/context/AuthContext';

export function App() {
  return (
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
  );
}

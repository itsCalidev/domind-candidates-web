import { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildTheme } from '@/theme';
import { AppRouter } from '@/routes/AppRouter';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { SessionGuard } from '@/features/auth/components/SessionGuard';
import { queryClient } from '@/lib/query/queryClient';
import { ToastProvider } from '@/shared/context/ToastContext';
import { AccessibilityProvider, useAccessibility } from '@/shared/context/AccessibilityContext';

export function App() {
  return (
    // AccessibilityProvider es el más externo a propósito: aplica tamaño
    // de texto, alto contraste y modo oscuro incluso en /login, antes de
    // que exista sesión — no depende de Router ni de ningún otro
    // provider, y ThemedApp necesita `darkMode` para construir el theme.
    <AccessibilityProvider>
      <ThemedApp />
    </AccessibilityProvider>
  );
}

/**
 * Separado de `App` porque necesita leer `darkMode` de
 * AccessibilityContext (vía useAccessibility) para reconstruir el theme
 * de MUI — y un componente no puede consumir un contexto que él mismo
 * está montando un nivel más arriba.
 */
function ThemedApp() {
  const { darkMode } = useAccessibility();
  const theme = useMemo(() => buildTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* Normaliza estilos base del navegador respetando el tema */}
        <CssBaseline />
        <BrowserRouter>
          {/* AuthProvider vive dentro del Router: ProtectedRoute/GuestRoute
              necesitan <Navigate /> y useNavigate, que requieren contexto
              de enrutamiento. ToastProvider no depende de ninguno de los
              dos, pero vive aquí adentro para que cualquier página pueda
              usar useToast() sin preocuparse del orden de providers. */}
          <AuthProvider>
            <ToastProvider>
              {/* Necesita useAuth() (de AuthProvider) y useToast() (de
                  ToastProvider) a la vez, por eso vive aquí adentro y no
                  más arriba. */}
              <SessionGuard />
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

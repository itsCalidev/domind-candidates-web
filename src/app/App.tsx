import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '@/theme';
import { AppRouter } from '@/routes/AppRouter';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Normaliza estilos base del navegador respetando el tema */}
      <CssBaseline />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}

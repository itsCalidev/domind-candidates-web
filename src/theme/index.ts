import { createTheme, type Theme } from '@mui/material/styles';
import { getPalette, type ThemeMode } from './palette';
import { typography } from './typography';

/**
 * Tema global de la aplicación, ahora construido por modo (claro/oscuro)
 * en vez de exportado como un objeto estático — ver AccessibilityContext
 * (`darkMode`) y App.tsx (`ThemedApp`, que llama a esta función dentro de
 * un `useMemo` cada vez que el usuario cambia el modo).
 *
 * Principios de diseño (ver brief de identidad corporativa):
 * - Elegancia sobre efectos: sombras suaves, sin gradientes agresivos.
 * - Bordes redondeados moderados (look "ejecutivo", no juguetón).
 * - Espaciado generoso por defecto.
 */
export function buildTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: getPalette(mode),
    typography,
    shape: {
      borderRadius: 10,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingLeft: 20,
            paddingRight: 20,
            boxShadow: 'none',
          },
          contained: {
            boxShadow: '0px 2px 6px rgba(0, 74, 152, 0.18)',
            '&:hover': {
              boxShadow: '0px 4px 10px rgba(0, 74, 152, 0.24)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          // Forma función (no objeto fijo): en modo oscuro un borde
          // negro-sobre-negro es invisible, así que se calcula contra
          // `theme.palette.mode` en vez de hardcodear un solo valor.
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }),
        },
      },
    },
  });
}

import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';

/**
 * Tema global de la aplicación.
 *
 * Principios de diseño (ver brief de identidad corporativa):
 * - Elegancia sobre efectos: sombras suaves, sin gradientes agresivos.
 * - Bordes redondeados moderados (look "ejecutivo", no juguetón).
 * - Espaciado generoso por defecto.
 */
export const theme = createTheme({
  palette,
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
        root: {
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

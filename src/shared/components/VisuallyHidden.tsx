import { Box, type BoxProps } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

/**
 * Texto presente en el DOM (lo anuncia un lector de pantalla) pero
 * invisible en pantalla. Usa el mixin oficial de MUI (`@mui/utils`) en
 * vez de una clase propia, para no reinventar los mismos trucos de CSS
 * (clip-path, posición absoluta, overflow) que ya están probados ahí.
 *
 * Primer uso: describir en texto plano las gráficas de Recharts en
 * EconomyTab — un <svg> no tiene contenido legible para un lector de
 * pantalla por sí solo.
 */
export function VisuallyHidden({ children, ...props }: BoxProps) {
  return (
    <Box component="span" sx={visuallyHidden} {...props}>
      {children}
    </Box>
  );
}

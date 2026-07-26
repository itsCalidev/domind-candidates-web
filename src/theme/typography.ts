/**
 * Tipografía corporativa DOMIND.
 *
 * - Titillium Web: títulos y elementos de jerarquía alta (h1-h4).
 * - Lato: prácticamente todo lo demás (cuerpo, formularios, tablas, botones).
 *
 * Se importan como paquetes @fontsource en main.tsx, en lugar de vía
 * Google Fonts por CDN, para no depender de una petición externa en
 * producción y evitar parpadeo de fuente (FOUT).
 */

const fontDisplay = "'Titillium Web', sans-serif";
const fontBody = "'Lato', sans-serif";

export const typography = {
  fontFamily: fontBody,
  h1: { fontFamily: fontDisplay, fontWeight: 700 },
  h2: { fontFamily: fontDisplay, fontWeight: 700 },
  h3: { fontFamily: fontDisplay, fontWeight: 600 },
  h4: { fontFamily: fontDisplay, fontWeight: 600 },
  h5: { fontFamily: fontDisplay, fontWeight: 600 },
  h6: { fontFamily: fontDisplay, fontWeight: 600 },
  subtitle1: { fontFamily: fontBody, fontWeight: 600 },
  subtitle2: { fontFamily: fontBody, fontWeight: 600 },
  body1: { fontFamily: fontBody, fontWeight: 400 },
  body2: { fontFamily: fontBody, fontWeight: 400 },
  button: { fontFamily: fontBody, fontWeight: 600, textTransform: 'none' as const },
  caption: { fontFamily: fontBody, fontWeight: 400 },
  overline: { fontFamily: fontBody, fontWeight: 600 },
} as const;

/**
 * Tipografía corporativa DOMIND (manual de marca).
 *
 * - Titillium Web: títulos y elementos de jerarquía alta (h1-h4, y los
 *   títulos de tarjeta del reporte PDF — ver SectionCard en
 *   CandidateReportTemplate.tsx, que importa `fontDisplay` de aquí).
 * - Lato: prácticamente todo lo demás (cuerpo, formularios, tablas, botones).
 * - Arial: fallback operativo explícito si las dos anteriores no cargan
 *   (no un `sans-serif` genérico) — pedido así por el manual de marca.
 *
 * Se importan como paquetes @fontsource en main.tsx, en lugar de vía
 * Google Fonts por CDN, para no depender de una petición externa en
 * producción y evitar parpadeo de fuente (FOUT) — se exportan aquí en vez
 * de repetirlas donde haga falta, para que el fallback siga siendo el
 * mismo en toda la app si algún día cambia.
 */

export const fontDisplay = "'Titillium Web', Arial, sans-serif";
export const fontBody = "'Lato', Arial, sans-serif";

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

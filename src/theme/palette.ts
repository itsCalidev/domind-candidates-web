/**
 * Paleta corporativa DOMIND.
 *
 * Los colores "secundarios disponibles" existen para usarse puntualmente
 * (estados, gráficas, badges) — no como parte del layout base. Por eso
 * viven separados de los colores principales de la marca.
 */

export const brandColors = {
  bluePrimary: '#004A98',
  blueSecondary: '#0083C1',
  grey: '#706F6F',
} as const;

/**
 * Colores secundarios: pensados para diferenciar estados o categorías
 * (ej. estatus de un candidato, series en una gráfica), nunca para UI
 * estructural (fondos, texto, bordes).
 */
export const accentColors = {
  skyBlue: '#67B1E3',
  teal: '#26B4B0',
  green: '#76B82A',
  yellow: '#FDC52C',
  orange: '#F39200',
  purple: '#69478E',
} as const;

export const palette = {
  primary: {
    main: brandColors.bluePrimary,
    light: brandColors.blueSecondary,
    dark: '#00335F',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: brandColors.blueSecondary,
    contrastText: '#FFFFFF',
  },
  grey: {
    500: brandColors.grey,
  },
  success: {
    main: accentColors.green,
  },
  warning: {
    main: accentColors.yellow,
  },
  error: {
    main: '#D32F2F',
  },
  info: {
    main: accentColors.skyBlue,
  },
  background: {
    default: '#F7F8FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: brandColors.grey,
  },
} as const;

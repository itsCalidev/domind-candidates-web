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

/**
 * Tokens que NO cambian entre modo claro/oscuro: la identidad de marca
 * (azules corporativos, colores de estado) se mantiene, solo cambian
 * fondos/textos/superficies (ver `getPalette`).
 */
const sharedPaletteTokens = {
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
} as const;

const lightPalette = {
  ...sharedPaletteTokens,
  mode: 'light' as const,
  background: {
    default: '#F7F8FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: brandColors.grey,
  },
};

/**
 * Fondos "#121212"/"#1E1E1E" (no negro puro) a propósito: es la
 * recomendación estándar de Material Design para modo oscuro — negro
 * puro (#000) contra texto blanco puro genera demasiado contraste y
 * cansa la vista en sesiones largas, justo lo opuesto de lo que se busca.
 */
const darkPalette = {
  ...sharedPaletteTokens,
  mode: 'dark' as const,
  background: {
    default: '#121212',
    paper: '#1E1E1E',
  },
  text: {
    primary: '#F5F5F5',
    secondary: '#B3B3B3',
  },
};

export type ThemeMode = 'light' | 'dark';

/** Fuente única de paleta para theme/index.ts — nunca se construye un `createTheme` con otra cosa. */
export function getPalette(mode: ThemeMode) {
  return mode === 'dark' ? darkPalette : lightPalette;
}

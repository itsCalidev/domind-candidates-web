import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'domind_a11y_settings';

/**
 * Pasos discretos de tamaño de texto, en px del <html> — ver
 * AccessibilityMenu (A-/A/A+). Nivel AAA: 4 pasos por encima del
 * default (16→24), no solo 2, para cubrir baja visión más severa.
 */
const FONT_SIZE_STEPS = [14, 16, 18, 20, 22, 24] as const;
type FontSizeStep = (typeof FONT_SIZE_STEPS)[number];
/** Mismo valor que el `htmlFontSize` por defecto de MUI, así que "restablecer" vuelve al tamaño de fábrica. */
const DEFAULT_FONT_SIZE: FontSizeStep = 16;

interface AccessibilitySettings {
  fontSize: FontSizeStep;
  highContrast: boolean;
  /**
   * A diferencia de `highContrast` (clase CSS a la fuerza, ver
   * index.css), el modo oscuro se integra en el `palette.mode` real de
   * MUI (ver theme/index.ts) — por eso este flag no dispara ningún
   * efecto de DOM aquí mismo; `App.tsx` lo lee para reconstruir el theme.
   */
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: DEFAULT_FONT_SIZE,
  highContrast: false,
  darkMode: false,
};

function isFontSizeStep(value: unknown): value is FontSizeStep {
  return typeof value === 'number' && (FONT_SIZE_STEPS as readonly number[]).includes(value);
}

function readStoredSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    return {
      fontSize: isFontSizeStep(parsed.fontSize) ? parsed.fontSize : DEFAULT_FONT_SIZE,
      highContrast: parsed.highContrast === true,
      darkMode: parsed.darkMode === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface AccessibilityContextValue {
  fontSize: FontSizeStep;
  highContrast: boolean;
  darkMode: boolean;
  canIncreaseFontSize: boolean;
  canDecreaseFontSize: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleHighContrast: () => void;
  toggleDarkMode: () => void;
  /** Botón "Restablecer preferencias" del popover: vuelve las 3 opciones a su valor de fábrica. */
  resetAll: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Preferencias de accesibilidad: tamaño de texto, alto contraste y modo
 * oscuro.
 *
 * Persisten en `localStorage` (no `sessionStorage`, a diferencia de los
 * tokens de sesión en tokenStorage.ts): son preferencias del dispositivo/
 * usuario, deben sobrevivir a cerrar el navegador, y no son información
 * sensible.
 *
 * Se monta en App.tsx FUERA de <AuthProvider> y de <ThemeProvider> a
 * propósito: estas preferencias deben aplicarse también en /login, antes
 * de que exista sesión, y `darkMode` es justamente el insumo que
 * ThemedApp usa para construir el theme de MUI.
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(readStoredSettings);

  // Único punto que toca el DOM fuera de React: <html> para que TODA la
  // tipografía rem de MUI escale (ver theme/typography.ts, sin
  // htmlFontSize propio → usa el default de MUI, 16px, igual que
  // DEFAULT_FONT_SIZE aquí) y <body> para el modo de alto contraste
  // (ver index.css, selector `body.high-contrast`).
  useEffect(() => {
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.body.classList.toggle('high-contrast', settings.highContrast);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function increaseFontSize() {
    setSettings((prev) => {
      const nextIndex = Math.min(FONT_SIZE_STEPS.indexOf(prev.fontSize) + 1, FONT_SIZE_STEPS.length - 1);
      return { ...prev, fontSize: FONT_SIZE_STEPS[nextIndex] };
    });
  }

  function decreaseFontSize() {
    setSettings((prev) => {
      const nextIndex = Math.max(FONT_SIZE_STEPS.indexOf(prev.fontSize) - 1, 0);
      return { ...prev, fontSize: FONT_SIZE_STEPS[nextIndex] };
    });
  }

  function resetFontSize() {
    setSettings((prev) => ({ ...prev, fontSize: DEFAULT_FONT_SIZE }));
  }

  function toggleHighContrast() {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }

  function toggleDarkMode() {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }

  function resetAll() {
    setSettings(DEFAULT_SETTINGS);
  }

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      fontSize: settings.fontSize,
      highContrast: settings.highContrast,
      darkMode: settings.darkMode,
      canIncreaseFontSize: settings.fontSize < FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1],
      canDecreaseFontSize: settings.fontSize > FONT_SIZE_STEPS[0],
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      toggleHighContrast,
      toggleDarkMode,
      resetAll,
    }),
    [settings],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility debe usarse dentro de <AccessibilityProvider>');
  }
  return ctx;
}

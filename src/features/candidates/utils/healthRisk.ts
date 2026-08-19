import { accentColors } from '@/theme/palette';
import type { CandidateHealth } from '../types/candidate.types';

export interface HealthRiskFactor {
  label: string;
  weight: number;
  /** Color fijo (no depende del theme): son categóricos, igual que los colores de EconomyTab. */
  color: string;
  active: boolean;
}

/**
 * Colores puntuales para este widget — no viven en theme/palette.ts
 * porque son demasiado específicos ("vino" para drogas, "humo" para
 * tabaco) para reutilizarse en ningún otro lugar de la app.
 */
const WINE_RED = '#7B241C';
const SMOKE_GREY = '#78716C';

const FREQUENT_ALCOHOL_KEYWORDS = ['frecuente', 'diario', 'fines de semana'];
const POOR_DIET_VALUES = ['mala', 'regular'];

function matchesKeyword(value: string | null, keywords: string[]): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Reglas de negocio del "Vaso de Riesgo Acumulado", tal como las definió
 * el cliente: 5 hábitos, cada uno suma un porcentaje fijo si está
 * presente. El total nunca pasa de 100 (30+20+20+15+15) pero se
 * clampea igual por seguridad.
 */
export function computeHealthRisk(health: CandidateHealth): {
  total: number;
  factors: HealthRiskFactor[];
} {
  const factors: HealthRiskFactor[] = [
    { label: 'Uso de drogas', weight: 30, color: WINE_RED, active: health.usedDrugs === true },
    { label: 'Fuma', weight: 20, color: SMOKE_GREY, active: health.smokes === true },
    {
      label: 'Consumo frecuente de alcohol',
      weight: 20,
      color: accentColors.orange,
      active: matchesKeyword(health.alcoholFrequency, FREQUENT_ALCOHOL_KEYWORDS),
    },
    {
      label: 'Alimentación deficiente',
      weight: 15,
      color: accentColors.yellow,
      active: matchesKeyword(health.dietQuality, POOR_DIET_VALUES),
    },
    {
      label: 'Sedentarismo',
      weight: 15,
      color: accentColors.purple,
      active: (health.sedentaryHours ?? 0) > 8,
    },
  ];

  const total = Math.min(
    100,
    factors.reduce((sum, factor) => sum + (factor.active ? factor.weight : 0), 0),
  );

  return { total, factors };
}

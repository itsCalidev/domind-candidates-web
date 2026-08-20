/**
 * Clasificación de los campos de texto libre de `health` para las
 * tarjetas clínicas de HealthTab: nunca se le pide al usuario que lea
 * un párrafo — cada campo se convierte en un chip, un ícono o una barra,
 * según lo que mejor comunique "sano" vs. "requiere atención" de un
 * vistazo.
 */

/**
 * `null` es el caso normal de "sin dato" (ver candidateService.ts), pero
 * se compara también contra el texto plano "No especificado" por si
 * alguna vez llega literal desde el backend — nunca debe mostrarse como
 * si fuera información real.
 */
export function isEmptyMedicalText(value: string | null): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'no especificado';
}

/** Convierte "Diabetes, Hipertensión" en ['Diabetes', 'Hipertensión'] para mapearlo a chips individuales. */
export function splitMedicalEntries(value: string | null): string[] {
  if (isEmptyMedicalText(value)) return [];
  return value!
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const HEALTHY_ASPECT_KEYWORDS = ['saludable', 'sano', 'buen estado', 'cuidado'];
const NEGLECTED_ASPECT_KEYWORDS = ['descuidado', 'desaliñado', 'mal estado', 'deteriorado'];

export type ChipSeverity = 'success' | 'warning' | 'default';

export function classifyPhysicalAspect(value: string | null): ChipSeverity {
  if (isEmptyMedicalText(value)) return 'default';
  const normalized = value!.toLowerCase();
  if (NEGLECTED_ASPECT_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'warning';
  if (HEALTHY_ASPECT_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'success';
  return 'default';
}

interface CurrentHealthLevel {
  keywords: string[];
  percent: number;
  color: 'success' | 'warning' | 'error';
}

const CURRENT_HEALTH_LEVELS: CurrentHealthLevel[] = [
  { keywords: ['excelente', 'muy buena', 'muy bueno'], percent: 100, color: 'success' },
  { keywords: ['buena', 'bueno'], percent: 75, color: 'success' },
  { keywords: ['regular'], percent: 50, color: 'warning' },
  { keywords: ['mala', 'malo', 'delicad'], percent: 20, color: 'error' },
];

export interface CurrentHealthMeter {
  hasData: boolean;
  percent: number;
  color: 'success' | 'warning' | 'error' | 'inherit';
}

/** Sin keyword reconocida pero con texto presente: se muestra a la mitad, en gris — no se inventa un veredicto de salud que el texto no dio. */
export function classifyCurrentHealth(value: string | null): CurrentHealthMeter {
  if (isEmptyMedicalText(value)) return { hasData: false, percent: 0, color: 'inherit' };

  const normalized = value!.toLowerCase();
  const match = CURRENT_HEALTH_LEVELS.find((level) => level.keywords.some((keyword) => normalized.includes(keyword)));
  if (match) return { hasData: true, percent: match.percent, color: match.color };
  return { hasData: true, percent: 50, color: 'inherit' };
}

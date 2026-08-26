/**
 * Clasificación del "Índice de Arraigo" a partir de `housingConditions`
 * (texto libre) y `hasInfonavitDebt`. `housingConditions` no es un enum
 * documentado en el backend, así que se evalúa por palabras clave, igual
 * que dietQuality/physicalActivity en healthQualitative.ts.
 */

export type ArraigoLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface ArraigoAssessment {
  level: ArraigoLevel;
  severity: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

const HIGH_KEYWORDS = ['propia'];
const MEDIUM_KEYWORDS = ['hipotecada', 'hipoteca', 'en pagos'];
const LOW_KEYWORDS = ['prestada', 'rentada', 'renta'];

export function assessArraigo(
  housingConditions: string | null,
  hasInfonavitDebt: boolean | null,
): ArraigoAssessment {
  const normalized = housingConditions?.trim().toLowerCase() ?? '';

  if (HIGH_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return { level: 'high', severity: 'success', title: 'Arraigo Alto', message: 'Vivienda propia.' };
  }

  if (MEDIUM_KEYWORDS.some((keyword) => normalized.includes(keyword)) || hasInfonavitDebt === true) {
    return {
      level: 'medium',
      severity: 'info',
      title: 'Estabilidad Media',
      message: 'Vivienda en proceso de pago (Hipoteca/Infonavit).',
    };
  }

  if (LOW_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return {
      level: 'low',
      severity: 'warning',
      title: 'Arraigo Bajo',
      message: `Vivienda ${housingConditions}.`,
    };
  }

  // Sin keyword reconocida: si SÍ hay texto (una condición no listada,
  // ej. "Prestada por familiar"), se trata igual que "bajo" con su
  // propio texto — no se descarta la información capturada. Si NO hay
  // texto en absoluto, no hay evidencia de nada: se muestra un estado
  // neutral en vez de alarmar por datos que simplemente no existen.
  if (normalized) {
    return { level: 'low', severity: 'warning', title: 'Arraigo Bajo', message: `Vivienda ${housingConditions}.` };
  }

  return {
    level: 'unknown',
    severity: 'info',
    title: 'Arraigo sin evaluar',
    message: 'No se registró la condición de la vivienda.',
  };
}

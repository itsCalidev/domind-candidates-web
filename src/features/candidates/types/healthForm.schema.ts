import { z } from 'zod';

/** Opciones sugeridas de la UI, dadas directamente por el usuario en el chat. */
export const HEALTHCARE_ACCESS_OPTIONS = ['IMSS', 'ISSSTE', 'Médico particular', 'SSA', 'DIF'] as const;
export const ALCOHOL_TYPE_OPTIONS = ['Licor', 'Vinos', 'Cerveza', 'Cocteles', 'Tequila'] as const;
export const DIET_QUALITY_OPTIONS = ['Buena', 'Regular', 'Mala'] as const;
export const PHYSICAL_ACTIVITY_OPTIONS = ['Sedentario', 'Ligera', 'Intensa', 'Atleta'] as const;
/** Los 4 strings exactos que `classifyCurrentHealth` (healthQualitative.ts) sabe mapear a un % de la barra de progreso — cualquier otro texto cae en el "50% gris" de esa función. */
export const CURRENT_HEALTH_OPTIONS = ['Excelente', 'Buena', 'Regular', 'Mala'] as const;
/** Marcador de UI para "Otro" en los checkboxes de healthcareAccess/alcoholTypes — nunca se envía tal cual al backend. */
export const OTHER_OPTION = 'Otro';

const DECIMAL_REGEX = /^\d{1,3}(\.\d{1,2})?$/;
const INTEGER_REGEX = /^\d{1,3}$/;

const optionalDecimal = (message: string) =>
  z.string().trim().regex(DECIMAL_REGEX, message).optional().or(z.literal(''));
const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).optional().or(z.literal(''));
/** `'yes' | 'no' | ''` — `''` es "todavía sin responder", nunca se colapsa a `false` (mismo criterio que las preguntas de riesgo de FamilyTab). */
const triState = z.enum(['yes', 'no', '']);

/**
 * Formulario de edición de Estado de Salud. Los campos numéricos viajan
 * como string (lo que produce un input controlado por react-hook-form) y
 * se convierten a `number` recién al construir el payload — mismo
 * criterio que `age` en familyForm.schema.ts.
 */
export const healthFormSchema = z.object({
  weight: optionalDecimal('Ingresa un peso válido'),
  height: optionalDecimal('Ingresa una estatura válida'),
  usesGlasses: triState,
  physicalAspect: optionalText(150),
  currentHealth: z.enum([...CURRENT_HEALTH_OPTIONS, '']),
  chronicDiseasesFamily: triState,
  chronicDiseasesDetails: optionalText(255),
  // Tri-estado también aquí: son campos de UI (no viajan al payload), solo
  // deciden si se muestra/oculta el input de texto de pastDiseases/surgeries.
  pastDiseasesFlag: triState,
  pastDiseases: optionalText(255),
  surgeriesFlag: triState,
  surgeries: optionalText(255),
  healthcareAccess: z.array(z.string()),
  healthcareAccessOther: optionalText(150),
  alcoholFrequency: optionalText(150),
  alcoholTypes: z.array(z.string()),
  alcoholTypesOther: optionalText(150),
  smokes: triState,
  cigarettesPerDay: z.string().trim().regex(INTEGER_REGEX, 'Ingresa un número entero').optional().or(z.literal('')),
  smokingExpensePerWeek: optionalDecimal('Ingresa un monto válido'),
  usedDrugs: triState,
  drugsDetails: optionalText(255),
  dietQuality: z.enum([...DIET_QUALITY_OPTIONS, '']),
  physicalActivity: z.enum([...PHYSICAL_ACTIVITY_OPTIONS, '']),
  sedentaryHours: optionalDecimal('Ingresa un número de horas válido'),
  screenTimeHours: optionalDecimal('Ingresa un número de horas válido'),
});

export type HealthFormValues = z.infer<typeof healthFormSchema>;

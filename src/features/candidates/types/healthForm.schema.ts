import { z } from 'zod';

/** Opciones sugeridas de la UI, dadas directamente por el usuario en el chat. */
export const HEALTHCARE_ACCESS_OPTIONS = ['IMSS', 'ISSSTE', 'Médico particular', 'SSA', 'DIF'] as const;
export const ALCOHOL_TYPE_OPTIONS = ['Licor', 'Vinos', 'Cerveza', 'Cocteles', 'Tequila'] as const;
export const DIET_QUALITY_OPTIONS = ['Buena', 'Regular', 'Mala'] as const;
export const PHYSICAL_ACTIVITY_OPTIONS = ['Sedentario', 'Ligera', 'Intensa', 'Atleta'] as const;

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
  currentHealth: optionalText(150),
  chronicDiseasesFamily: triState,
  chronicDiseasesDetails: optionalText(255),
  pastDiseases: optionalText(255),
  surgeries: optionalText(255),
  healthcareAccess: z.array(z.string()),
  alcoholFrequency: optionalText(150),
  alcoholTypes: z.array(z.string()),
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

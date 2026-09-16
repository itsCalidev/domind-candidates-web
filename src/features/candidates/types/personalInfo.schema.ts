import { z } from 'zod';

const MIN_AGE_YEARS = 18;

/**
 * Fecha máxima seleccionable para `birthDate`: hoy menos 18 años, en
 * formato `YYYY-MM-DD` (el mismo que produce/consume `<input type="date">`,
 * comparable lexicográficamente como fecha por venir siempre con el mismo
 * padding). Se recalcula en cada llamada — nunca se memoiza en una
 * constante de módulo — para no quedar desfasada en una sesión larga del
 * navegador. La usan tanto el schema (`birthDate.refine`) como el
 * atributo `max` del input en GeneralInfoTab, para que la restricción del
 * navegador y la del formulario sean siempre la misma fecha.
 */
export function maxBirthDateForAdult(): string {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  return cutoff.toISOString().slice(0, 10);
}

/**
 * Hoy en formato `YYYY-MM-DD` — tope para `spouseBirthDate` y
 * `studiesProofDate` (el usuario pidió explícitamente no permitir fechas
 * futuras en ninguno de los dos). Mismo criterio de "no memoizar" que
 * `maxBirthDateForAdult`.
 */
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

const PHONE_REGEX = /^[\d\s()+-]*$/;
const POSTAL_CODE_REGEX = /^\d{5}$/;

/**
 * Opciones sugeridas para los Select de `highestEducation`/
 * `studiesProofType` — el backend las acepta como texto libre (String,
 * máx. 100, confirmado por el usuario), así que esta lista solo limita
 * qué puede elegir el reclutador desde la UI, no es un enum del backend.
 */
export const HIGHEST_EDUCATION_OPTIONS = [
  'Primaria',
  'Secundaria',
  'Bachillerato',
  'Licenciatura',
  'Maestría',
  'Doctorado',
] as const;

export const STUDIES_PROOF_TYPE_OPTIONS = ['Certificado', 'Título', 'Constancia'] as const;

/**
 * Formulario de edición de datos personales (GeneralInfoTab, modo
 * edición). Reglas de formato/longitud dadas directamente por el usuario
 * en el chat. Solo `firstName`/`lastName` son obligatorios (identidad
 * básica del candidato, mismo criterio que CreateAndAssignCandidateDialog)
 * — el resto puede seguir vacío mientras la captura sigue en `DRAFT`, así
 * que cada uno acepta `''` y solo valida formato/longitud cuando sí trae
 * un valor.
 */
export const personalInfoSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(150, 'Máximo 150 caracteres'),
  email: z
    .string()
    .trim()
    .max(255, 'Máximo 255 caracteres')
    .email('Ingresa un correo válido')
    .optional()
    .or(z.literal('')),
  // El regex ya acepta '' (el cuantificador `*` permite cero coincidencias),
  // así que no hace falta un `.optional().or(z.literal(''))` extra aquí.
  phone: z
    .string()
    .trim()
    .max(15, 'Máximo 15 caracteres')
    .regex(PHONE_REGEX, 'Solo se permiten dígitos, espacios, guiones, paréntesis y el símbolo +'),
  address: z.string().trim().max(255, 'Máximo 255 caracteres'),
  neighborhood: z.string().trim().max(150, 'Máximo 150 caracteres'),
  postalCode: z
    .string()
    .trim()
    .regex(POSTAL_CODE_REGEX, 'Debe tener exactamente 5 dígitos')
    .optional()
    .or(z.literal('')),
  birthPlace: z.string().trim().max(150, 'Máximo 150 caracteres'),
  maritalStatus: z
    .enum(['SINGLE', 'MARRIED', 'FREE_UNION', 'DIVORCED', 'WIDOWED'])
    .optional()
    .or(z.literal('')),
  birthDate: z.string().refine((value) => !value || value <= maxBirthDateForAdult(), {
    message: 'El candidato debe ser mayor de edad (18 años)',
  }),
  spouseBirthDate: z.string().refine((value) => !value || value <= todayISODate(), {
    message: 'La fecha no puede ser posterior a hoy',
  }),
  highestEducation: z.string().trim().max(100, 'Máximo 100 caracteres'),
  studiesProofType: z.string().trim().max(100, 'Máximo 100 caracteres'),
  studiesProofDate: z.string().refine((value) => !value || value <= todayISODate(), {
    message: 'La fecha no puede ser posterior a hoy',
  }),
});

export type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

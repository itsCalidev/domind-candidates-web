import { z } from 'zod';

function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .or(z.literal(''));
}

// Sin `z.preprocess` a propósito: mezclar `preprocess` con
// `useForm<z.infer<...>>` confunde el tipo de `Resolver` de RHF (el
// input del preprocess es `unknown`, no el tipo final) y `tsc` lo
// rechaza. La conversión "vacío → undefined" de un input numérico vacío
// se hace en `CandidateHousingStep.tsx` vía `setValueAs` en `register`,
// así que para cuando este schema valida, el valor ya es `number |
// undefined` — nunca `NaN` ni string vacío.
const optionalNonNegativeInt = z.number().int().nonnegative('No puede ser negativo').optional();
const optionalNonNegativeNumber = z.number().nonnegative('No puede ser negativo').optional();

/**
 * Valida el paso "Vivienda" del formulario de candidato antes de mandarlo
 * a PATCH /candidates/:id/housing (ver candidateService.ts). Todos los
 * campos son opcionales porque el PATCH real también lo es
 * (CandidateHousingPayload) — no se inventan reglas de "obligatorio" que
 * el backend no pidió.
 */
export const candidateHousingSchema = z
  .object({
    propertyOwner: optionalTrimmedString(255),
    timeLivingThere: optionalTrimmedString(255),
    previousAddress: optionalTrimmedString(255),
    hasInfonavitDebt: z.boolean(),
    infonavitAmount: optionalNonNegativeNumber,
    infonavitCreditNumber: optionalTrimmedString(50),
    housingConditions: optionalTrimmedString(1000),
    housingType: optionalTrimmedString(255),
    roomsCount: optionalNonNegativeInt,
    livingRoomCount: optionalNonNegativeInt,
    diningRoomCount: optionalNonNegativeInt,
    kitchenCount: optionalNonNegativeInt,
    bathroomsCount: optionalNonNegativeInt,
    patioCount: optionalNonNegativeInt,
    publicServices: z.array(z.string()),
  })
  .strict();

export type CandidateHousingFormValues = z.infer<typeof candidateHousingSchema>;

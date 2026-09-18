import { z } from 'zod';

/** Opciones exactas dadas por el usuario en el chat, confirmadas contra el DTO real de PATCH /candidates/:id/housing. */
export const HOUSING_TYPE_OPTIONS = ['Casa sola', 'Casa dúplex', 'Casa Huéspedes', 'Condominio', 'Otro'] as const;
export const HOUSING_CONDITIONS_OPTIONS = ['Propia', 'En pagos', 'Rentada', 'Hipotecada', 'Prestada'] as const;
export const PUBLIC_SERVICES_OPTIONS = ['Agua', 'Luz', 'Gas', 'Drenaje', 'Internet', 'Telecable'] as const;

const INTEGER_REGEX = /^\d{1,3}$/;
const DECIMAL_REGEX = /^\d{1,9}(\.\d{1,2})?$/;

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().or(z.literal(''));
const optionalInteger = () =>
  z.string().trim().regex(INTEGER_REGEX, 'Ingresa un número entero').optional().or(z.literal(''));
/** `'yes' | 'no' | ''` — `''` es "todavía sin responder", nunca se colapsa a `false` (mismo criterio que el resto de los formularios de esta sesión). */
const triState = z.enum(['yes', 'no', '']);

/**
 * Formulario de edición de Vivienda. Los campos numéricos viajan como
 * string (lo que produce un input controlado por react-hook-form) y se
 * convierten a `number` recién al construir el payload — mismo criterio
 * que el resto de los formularios de candidato (healthForm.schema.ts,
 * familyForm.schema.ts).
 */
export const housingFormSchema = z.object({
  housingType: z.enum([...HOUSING_TYPE_OPTIONS, '']),
  housingConditions: z.enum([...HOUSING_CONDITIONS_OPTIONS, '']),
  propertyOwner: optionalText(150),
  timeLivingThere: optionalText(100),
  previousAddress: optionalText(255),
  roomsCount: optionalInteger(),
  bathroomsCount: optionalInteger(),
  livingRoomCount: optionalInteger(),
  diningRoomCount: optionalInteger(),
  kitchenCount: optionalInteger(),
  patioCount: optionalInteger(),
  publicServices: z.array(z.string()),
  hasInfonavitDebt: triState,
  infonavitAmount: z.string().trim().regex(DECIMAL_REGEX, 'Ingresa un monto válido').optional().or(z.literal('')),
  infonavitCreditNumber: optionalText(50),
});

export type HousingFormValues = z.infer<typeof housingFormSchema>;

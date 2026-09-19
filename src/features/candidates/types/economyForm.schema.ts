import { z } from 'zod';

const DECIMAL_REGEX = /^\d{1,9}(\.\d{1,2})?$/;

const amountField = () =>
  z.string().trim().regex(DECIMAL_REGEX, 'Ingresa un monto válido').optional().or(z.literal(''));

const incomeItemSchema = z.object({
  source: z.string().trim().min(1, 'La fuente es obligatoria').max(150, 'Máximo 150 caracteres'),
  amount: amountField(),
});

const vehicleItemSchema = z.object({
  model: z.string().trim().min(1, 'El modelo es obligatorio').max(150, 'Máximo 150 caracteres'),
  value: amountField(),
});

const debtItemSchema = z.object({
  creditor: z.string().trim().min(1, 'El acreedor es obligatorio').max(150, 'Máximo 150 caracteres'),
  amount: amountField(),
  monthlyPayment: amountField(),
});

const bankCardItemSchema = z.object({
  bank: z.string().trim().min(1, 'El banco es obligatorio').max(150, 'Máximo 150 caracteres'),
  creditLimit: amountField(),
});

/**
 * Formulario de edición de Economía Familiar. Los montos viajan como
 * string (lo que produce un input controlado por react-hook-form) y se
 * convierten a `number` recién al construir el payload — mismo criterio
 * que el resto de los formularios de candidato. `expensesTotal` NO es un
 * campo del formulario: EconomyTab lo calcula sumando las 9 categorías
 * de gasto justo antes de enviarlo, nunca lo captura el usuario a mano.
 *
 * `hasOtherIncome` es `'yes' | 'no'` (no tri-estado): a diferencia de las
 * preguntas de riesgo de Salud/Familia, este PATCH siempre reemplaza el
 * objeto entero (confirmado por el usuario), así que no existe un envío
 * parcial donde "sin responder" tenga sentido — hay que mandar sí o no.
 */
export const economyFormSchema = z.object({
  expensesFood: amountField(),
  expensesLight: amountField(),
  expensesGas: amountField(),
  expensesPhone: amountField(),
  expensesTransport: amountField(),
  expensesEducation: amountField(),
  expensesMedical: amountField(),
  expensesRentOther: amountField(),
  expensesExtra: amountField(),
  hasOtherIncome: z.enum(['yes', 'no']),
  otherIncomeDetails: z.string().trim().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  incomes: z.array(incomeItemSchema),
  vehicles: z.array(vehicleItemSchema),
  debts: z.array(debtItemSchema),
  bankCards: z.array(bankCardItemSchema),
});

export type EconomyFormValues = z.infer<typeof economyFormSchema>;

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
 * `otherExpenses` reemplaza al viejo `otherIncomeDetails` de texto libre
 * — el usuario confirmó que el backend cambió `hasOtherIncome`/
 * `otherIncomeDetails` por `hasOtherExpenses` + una tabla relacional
 * `concept`/`amount`, mismo patrón que incomes/vehicles/debts/bankCards.
 */
const otherExpenseItemSchema = z.object({
  concept: z.string().trim().min(1, 'El nombre del egreso es obligatorio').max(150, 'Máximo 150 caracteres'),
  amount: amountField(),
});

/**
 * `''` es "todavía sin responder" — el RadioGroup arranca sin ninguna
 * opción marcada en vez de defaultear a "No" (que antes se leía como una
 * respuesta real del candidato/reclutador sin que nadie la hubiera dado).
 * El `superRefine` de abajo es quien de verdad exige "Sí" o "No" antes de
 * poder guardar — este enum solo describe los valores posibles del campo.
 */
const requiredYesNo = z.enum(['yes', 'no', '']);

/**
 * Formulario de edición de Economía Familiar. Los montos viajan como
 * string (lo que produce un input controlado por react-hook-form) y se
 * convierten a `number` recién al construir el payload — mismo criterio
 * que el resto de los formularios de candidato. `expensesTotal` NO es un
 * campo del formulario: EconomyTab lo calcula sumando las 9 categorías
 * de gasto justo antes de enviarlo, nunca lo captura el usuario a mano.
 *
 * `hasOtherExpenses` sigue siendo `'yes' | 'no'` binario (fuera del
 * alcance de este cambio): a diferencia de las preguntas de riesgo de
 * Salud/Familia, este PATCH siempre reemplaza el objeto entero
 * (confirmado por el usuario), así que no existe un envío parcial donde
 * "sin responder" tenga sentido para ESE campo — hay que mandar sí o no.
 * Al pasar a "No", EconomyTab vacía `otherExpenses` por completo.
 *
 * `hasVehicles`/`hasBankCards`/`hasDebts` SÍ necesitan distinguir "sin
 * responder" de "No": el reclutador debe poder ver que el candidato
 * respondió explícitamente que no tiene vehículos/tarjetas/deudas, en
 * vez de que un valor por defecto se lea como esa misma respuesta sin
 * que nadie la haya dado. El backend ya modela esto como `boolean | null`
 * (ver `CandidateEconomy` en candidate.types.ts), así que enviar `null`
 * es un valor legítimo, no una invención de este formulario.
 */
export const economyFormSchema = z
  .object({
    expensesFood: amountField(),
    expensesLight: amountField(),
    expensesGas: amountField(),
    expensesPhone: amountField(),
    expensesTransport: amountField(),
    expensesEducation: amountField(),
    expensesMedical: amountField(),
    expensesRentOther: amountField(),
    expensesExtra: amountField(),
    hasOtherExpenses: z.enum(['yes', 'no']),
    hasVehicles: requiredYesNo,
    hasBankCards: requiredYesNo,
    hasDebts: requiredYesNo,
    incomes: z.array(incomeItemSchema),
    vehicles: z.array(vehicleItemSchema),
    debts: z.array(debtItemSchema),
    bankCards: z.array(bankCardItemSchema),
    otherExpenses: z.array(otherExpenseItemSchema),
  })
  .superRefine((data, ctx) => {
    if (data.hasVehicles === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hasVehicles'], message: 'Selecciona si tienes vehículos' });
    }
    if (data.hasBankCards === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasBankCards'],
        message: 'Selecciona si tienes tarjetas bancarias',
      });
    }
    if (data.hasDebts === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hasDebts'], message: 'Selecciona si tienes deudas' });
    }
  });

export type EconomyFormValues = z.infer<typeof economyFormSchema>;

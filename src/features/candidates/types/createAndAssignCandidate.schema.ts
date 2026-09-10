import { z } from 'zod';

/**
 * Formulario del diálogo "Agregar Candidato". Solo nombre/apellido del
 * candidato + reclutador + modalidad — Puesto y Empresa se quitaron a
 * propósito: el candidato los captura en su propio formulario, no el
 * reclutador al darlo de alta. `firstName`/`lastName` son de mejor
 * esfuerzo — no hay un DTO de creación de candidatos confirmado todavía
 * (ver CreateAndAssignCandidatePayload en candidate.types.ts).
 * `candidateEmail` solo se exige (y se valida como correo) cuando
 * `fillMode === 'magicLink'`, vía `superRefine` — mismo patrón que
 * `buildUserFormSchema` para su campo `role` condicional a
 * `mode === 'create'`.
 */
const baseSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
    recruiterId: z.string().min(1, 'Selecciona un reclutador'),
    fillMode: z.enum(['manual', 'magicLink']),
    candidateEmail: z.string().trim().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  })
  .strict();

export const createAndAssignCandidateSchema = baseSchema.superRefine((data, ctx) => {
  if (data.fillMode !== 'magicLink') return;

  if (!data.candidateEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['candidateEmail'],
      message: 'El correo del candidato es obligatorio para autollenado.',
    });
    return;
  }

  if (!z.string().email().safeParse(data.candidateEmail).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['candidateEmail'],
      message: 'Ingresa un correo válido.',
    });
  }
});

export type CreateAndAssignCandidateFormValues = z.infer<typeof createAndAssignCandidateSchema>;

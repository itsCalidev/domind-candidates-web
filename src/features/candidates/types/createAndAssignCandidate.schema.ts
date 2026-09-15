import { z } from 'zod';

/**
 * Formulario del diálogo "Agregar Candidato". Solo nombre/apellido/correo
 * del candidato + reclutador + modalidad — Puesto y Empresa se quitaron a
 * propósito: el candidato los captura en su propio formulario, no el
 * reclutador al darlo de alta.
 *
 * `email` es el único campo de correo: siempre visible y obligatorio, sin
 * importar la modalidad elegida. Antes existía un segundo campo
 * (`candidateEmail`) que solo aparecía con `fillMode === 'magicLink'`
 * para el enlace de autollenado — se quitó a propósito (confirmado por el
 * usuario) para no duplicar el dato: ahora `email` se usa tanto como
 * correo informativo del candidato como destinatario del enlace cuando
 * aplica.
 */
export const createAndAssignCandidateSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'El correo es obligatorio')
      .max(255, 'Máximo 255 caracteres')
      .email('Ingresa un correo válido'),
    recruiterId: z.string().min(1, 'Selecciona un reclutador'),
    fillMode: z.enum(['manual', 'magicLink']),
  })
  .strict();

export type CreateAndAssignCandidateFormValues = z.infer<typeof createAndAssignCandidateSchema>;

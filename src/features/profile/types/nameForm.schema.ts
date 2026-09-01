import { z } from 'zod';

/** Body de PATCH /users/me/profile — solo nombre y apellido, ver profile.types.ts. */
export const nameFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
  })
  .strict();

export type NameFormValues = z.infer<typeof nameFormSchema>;

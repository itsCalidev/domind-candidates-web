import { z } from 'zod';

/** Body de PATCH /users/me/profile — solo nombre y apellido, ver profile.types.ts. */
export const nameFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
});

export type NameFormValues = z.infer<typeof nameFormSchema>;

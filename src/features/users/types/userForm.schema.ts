import { z } from 'zod';

const userFormBaseSchema = z
  .object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'El correo es obligatorio')
      .max(255, 'Máximo 255 caracteres')
      .email('Ingresa un correo válido'),
    role: z.string().optional(),
    /** Solo se renderiza (y se envía a un endpoint real) en modo `edit`; ver UserFormDialog. */
    isActive: z.boolean().optional(),
  })
  .strict();

export type UserFormMode = 'create' | 'edit';

/**
 * `role` solo es obligatorio en modo `create`: PATCH /users/:id no lo
 * acepta (el backend no permite cambiar el rol desde ese endpoint).
 *
 * Ya no se pide contraseña en ningún modo: el backend generará una
 * contraseña temporal para el usuario nuevo (ver CreateUserRequest /
 * mustChangePassword).
 */
export function buildUserFormSchema(mode: UserFormMode) {
  return userFormBaseSchema.superRefine((data, ctx) => {
    if (mode === 'create' && !data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Selecciona un rol',
      });
    }
  });
}

export type UserFormValues = z.infer<typeof userFormBaseSchema>;

import { z } from 'zod';

const userFormBaseSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  role: z.string().optional(),
});

export type UserFormMode = 'create' | 'edit';

/**
 * `role` solo es obligatorio en modo `create`: PUT /users/:id no lo
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

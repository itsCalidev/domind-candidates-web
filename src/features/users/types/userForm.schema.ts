import { z } from 'zod';

const userFormBaseSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  password: z.string().optional(),
  role: z.string().optional(),
});

export type UserFormMode = 'create' | 'edit';

/**
 * `password` y `role` solo son obligatorios en modo `create`: PUT
 * /users/:id no los acepta (el backend no permite cambiar contraseña ni
 * rol desde ese endpoint). Un único schema con validación condicional
 * evita tener dos formularios distintos, tal como se pidió.
 */
export function buildUserFormSchema(mode: UserFormMode) {
  return userFormBaseSchema.superRefine((data, ctx) => {
    if (mode !== 'create') return;

    if (!data.password || data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
    }
    if (!data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Selecciona un rol',
      });
    }
  });
}

export type UserFormValues = z.infer<typeof userFormBaseSchema>;

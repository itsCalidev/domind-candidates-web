import { z } from 'zod';

/**
 * Reglas tal cual las documenta UpdatePasswordDto en /docs-json: "Debe
 * contener al menos 8 caracteres, una mayúscula, una minúscula y un
 * número." Antes solo se validaba la longitud en frontend, así que una
 * contraseña como "aaaaaaaa" pasaba aquí y el backend la rechazaba con
 * un 400 — ahora el formulario da el error correcto antes de enviar.
 */
export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

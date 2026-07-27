import { z } from 'zod';

/**
 * Fuente única de verdad para la forma y las reglas del formulario de login.
 * El tipo TypeScript se deriva del schema (ver LoginFormValues abajo),
 * así que campo y regla nunca se desincronizan.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

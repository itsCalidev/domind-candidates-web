import { z } from 'zod';

/**
 * Fuente única de verdad para la forma y las reglas del formulario de login.
 * El tipo TypeScript se deriva del schema (ver LoginFormValues abajo),
 * así que campo y regla nunca se desincronizan.
 */
export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'El correo es obligatorio')
      .max(255, 'Máximo 255 caracteres')
      .email('Ingresa un correo válido'),
    password: z
      .string()
      .min(1, 'La contraseña es obligatoria')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'Máximo 72 caracteres'),
  })
  .strict();

export type LoginFormValues = z.infer<typeof loginSchema>;

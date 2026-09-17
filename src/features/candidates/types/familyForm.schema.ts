import { z } from 'zod';

/**
 * `name` es el único campo obligatorio de cada integrante (mismo criterio
 * del DTO real). `age` viaja como string en el formulario (lo que
 * produce un input de texto/número controlado por react-hook-form) y se
 * convierte a `number` recién al construir el payload — igual que
 * `postalCode` en personalInfo.schema.ts.
 */
const familyMemberSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  relationship: z.string().trim().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  age: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Ingresa una edad válida')
    .optional()
    .or(z.literal('')),
  occupation: z.string().trim().max(150, 'Máximo 150 caracteres').optional().or(z.literal('')),
  education: z.string().trim().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  // Texto libre a propósito (no el enum MaritalStatus): confirmado por el
  // usuario, el backend lo declara `String?` "por si escriben algo fuera
  // del Enum" — distinto de `maritalStatus` en personalInfo.schema.ts.
  maritalStatus: z.string().trim().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
});

/**
 * `hasGovRelatives`/`hasPoliticalPosts` son un tercer estado, no un
 * booleano: `''` representa "todavía sin responder" (para no forzar una
 * respuesta falsa solo por entrar a editar, mismo espíritu que el fix
 * del banner de riesgo en FamilyTab). Los textos condicionales no llevan
 * su propio `superRefine` — FamilyTab los limpia por UI (`setValue`) en
 * cuanto la respuesta pasa a "No", tal como pidió el usuario.
 */
export const familyFormSchema = z.object({
  familyMembers: z.array(familyMemberSchema),
  hasGovRelatives: z.enum(['yes', 'no', '']),
  govRelativesDetails: z.string().trim().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  hasPoliticalPosts: z.enum(['yes', 'no', '']),
  politicalPostsDetails: z.string().trim().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
});

export type FamilyFormValues = z.infer<typeof familyFormSchema>;
export type FamilyMemberFormValues = FamilyFormValues['familyMembers'][number];

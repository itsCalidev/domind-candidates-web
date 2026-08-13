/**
 * Roles reales del backend. NUNCA traducir ni modificar estos valores:
 * el frontend siempre trabaja con el mismo enum que usa la API.
 * Un texto amigable ("Administrador") se resolverá, si hace falta,
 * mediante un helper de presentación — no cambiando este valor.
 *
 * Se usa el patrón objeto `as const` en lugar de `enum` porque el
 * proyecto tiene `erasableSyntaxOnly` activado en tsconfig (TS 6),
 * que no permite `enum` real. Este patrón es el equivalente correcto:
 * mismo uso (`UserRole.ADMIN`), sin generar código no-erasable.
 */
export const UserRole = {
  SYSTEM: 'SYSTEM',
  ADMIN: 'ADMIN',
  RECRUITER: 'RECRUITER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export function hasFullAccess(role: UserRole | undefined): boolean {
  return role === UserRole.SYSTEM || role === UserRole.ADMIN;
}
export function isSystem(role: UserRole | undefined): boolean {
  return role === UserRole.SYSTEM;
}

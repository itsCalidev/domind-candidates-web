/**
 * Punto único de acceso a variables de entorno.
 *
 * Nunca se usa `import.meta.env` directamente fuera de este archivo:
 * así, si cambia el nombre de una variable o su forma de resolverse,
 * solo se ajusta aquí.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
} as const;

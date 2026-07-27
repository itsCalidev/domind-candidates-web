/**
 * Rutas de la aplicación como constantes.
 *
 * Evita strings mágicos ("/dashboard") repetidos por todo el código:
 * si una ruta cambia de path, se ajusta en un solo lugar.
 */
export const paths = {
  login: '/login',
  dashboard: '/dashboard',
  candidates: '/candidates',
  candidateDetail: (id: string) => `/candidates/${id}`,
  users: '/users',
  settings: '/settings',
} as const;

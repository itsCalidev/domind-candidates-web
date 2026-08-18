/**
 * Rutas de la aplicación como constantes.
 *
 * Evita strings mágicos ("/dashboard") repetidos por todo el código:
 * si una ruta cambia de path, se ajusta en un solo lugar.
 */
export const paths = {
  login: '/login',
  changePassword: '/change-password',
  profile: '/profile',
  dashboard: '/dashboard',
  candidates: '/candidates',
  candidateDetail: (id: string) => `/candidates/${id}`,
  users: '/users',
} as const;

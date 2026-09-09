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
  /** Fuera de ProtectedRoute (ver AppRouter.tsx): el candidato no tiene sesión JWT, solo un token temporal en `?token=`. */
  candidateForm: '/candidato/formulario',
} as const;

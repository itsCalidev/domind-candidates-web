/**
 * Mock del usuario en sesión, usado únicamente para poblar el Header
 * mientras no está conectada la API. Se reemplaza por el usuario real
 * (proveniente del login / sesión) en una fase posterior.
 */
export const mockCurrentUser = {
  name: 'Ana Martínez',
  role: 'Administradora',
  initials: 'AM',
};

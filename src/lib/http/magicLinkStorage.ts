const MAGIC_LINK_TOKEN_KEY = 'domind_magic_link_token';

/**
 * Acceso crudo al token de Magic Link en sessionStorage — gemelo de
 * tokenStorage.ts, misma razón para vivir en `lib/http`: `apiClient`
 * necesita leerlo para adjuntar `x-magic-link` en cada request, sin que
 * este directorio dependa de ninguna feature (ni siquiera
 * `candidate-auth`, que sí importa de aquí).
 *
 * `sessionStorage`, no `localStorage`, a propósito: el token es efímero
 * (vive 24h en el backend y se quema al primer
 * POST /candidates/:id/submit-form), así que no debe sobrevivir más allá
 * de la pestaña actual — decisión ya tomada por el usuario, no una
 * elección técnica nueva de este archivo.
 */
export const magicLinkStorage = {
  get(): string | null {
    return sessionStorage.getItem(MAGIC_LINK_TOKEN_KEY);
  },
  set(token: string): void {
    sessionStorage.setItem(MAGIC_LINK_TOKEN_KEY, token);
  },
  remove(): void {
    sessionStorage.removeItem(MAGIC_LINK_TOKEN_KEY);
  },
};

/**
 * Decodifica el payload de un JWT (base64url → JSON).
 *
 * IMPORTANTE: esto NO verifica la firma del token. Es una utilidad de
 * lectura para fines de presentación; la validación real del token
 * ocurre siempre en el backend en cada request.
 */
export function decodeJwtPayload<T>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

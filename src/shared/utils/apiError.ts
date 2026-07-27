import axios from 'axios';

/**
 * Extrae un mensaje legible del error de una llamada a la API.
 * NestJS suele devolver `{ message, error, statusCode }`, donde `message`
 * puede ser string o string[] (errores de validación de class-validator).
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
  }
  return fallback;
}

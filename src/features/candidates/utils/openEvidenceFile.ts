import { candidatesService } from '../services/candidateService';

/**
 * Abre un archivo de evidencia (PDF u otro documento no-imagen) en una
 * pestaña nueva. `url` requiere Authorization Bearer, así que no se puede
 * usar como `href` directo (un link nuevo no manda ese header) — se pide
 * como blob (mismo método que ya usa SecureImage para las miniaturas de
 * imagen) y se abre el object URL resultante. Devuelve `false` si falló,
 * para que el llamador decida cómo avisar (toast, etc.) sin duplicar esa
 * lógica en cada lugar que necesite abrir un archivo.
 */
export async function openEvidenceFile(url: string): Promise<boolean> {
  try {
    const blob = await candidatesService.getEvidenceImageBlob(url);
    window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

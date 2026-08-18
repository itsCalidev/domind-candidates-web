/**
 * Fuerza la descarga de un Blob ya obtenido (ej. la respuesta binaria de
 * un endpoint con `responseType: 'blob'`) simulando un clic en un <a>
 * invisible. Mismo patrón que ya usa `downloadCsv` en csv.ts, extraído
 * aquí porque este caso no genera el Blob — lo recibe — así que no le
 * corresponde vivir en un archivo con nombre de un formato específico.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

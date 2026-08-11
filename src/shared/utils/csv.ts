/**
 * Generación de archivos CSV — capa 3 de la arquitectura de exportación
 * (selección → transformación → generación). No conoce Users,
 * Candidates ni ningún dominio: recibe columnas + filas ya resueltas.
 *
 * Cuando exista la plantilla PDF institucional, esta es la única capa
 * que se reemplaza (ej. `shared/utils/pdf.ts` con la misma forma de
 * `columns` + `items`) — las capas de selección y transformación no
 * cambian.
 */
export interface CsvColumn<T> {
  label: string;
  getValue: (item: T) => string;
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv<T>(items: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const rows = items.map((item) => columns.map((c) => escapeCsvCell(c.getValue(item))).join(','));
  return [header, ...rows].join('\r\n');
}

export function downloadCsv<T>(fileName: string, items: T[], columns: CsvColumn<T>[]): void {
  const csvContent = buildCsv(items, columns);
  // BOM al inicio: sin esto, Excel interpreta acentos/ñ como caracteres
  // incorrectos al abrir el CSV directamente.
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

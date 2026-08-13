import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generación de archivos PDF — capa 3 de la arquitectura de exportación
 * (selección → transformación → generación), misma forma que
 * shared/utils/csv.ts. No conoce Candidates ni ningún dominio: recibe
 * un título + filas "Campo | Valor" ya resueltas.
 *
 * Esta es DELIBERADAMENTE la versión "etapa intermedia": una tabla
 * simple y legible, sin encabezado institucional, logotipo, firmas ni
 * pie de página. Cuando exista la plantilla oficial, esos elementos se
 * agregan aquí mismo (o en un archivo hermano) — la capa de
 * transformación de datos (ver candidateExport.ts) no cambia.
 */
export interface PdfRow {
  label: string;
  value: string;
}

export function downloadPdf(fileName: string, title: string, rows: PdfRow[]): void {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title, 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [['Campo', 'Valor']],
    body: rows.map((row) => [row.label, row.value]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [0, 74, 152] }, // azul corporativo DOMIND
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  });

  doc.save(fileName);
}

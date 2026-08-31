import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generación de archivos PDF — capa 3 de la arquitectura de exportación
 * (selección → transformación → generación), misma forma que
 * shared/utils/csv.ts. No conoce Candidates ni ningún dominio: recibe
 * columnas + filas ya resueltas.
 */

/**
 * Columna genérica para un PDF tabular (varias filas, varias columnas)
 * — misma forma que CsvColumn, para poder reutilizar exactamente las
 * mismas funciones de transformación en CSV y PDF sin duplicarlas.
 */
export interface PdfTableColumn<T> {
  label: string;
  getValue: (item: T) => string;
}

export interface DownloadTablePdfOptions<T> {
  fileName: string;
  title: string;
  /** Línea secundaria bajo el título (fecha de generación, filtros aplicados, etc.). */
  subtitle?: string;
  columns: PdfTableColumn<T>[];
  items: T[];
  /** true por defecto: con varias columnas de texto, horizontal aprovecha mejor el ancho. */
  landscape?: boolean;
}

/**
 * PDF tabular para un LISTADO (varias filas). Usa jspdf-autotable, que
 * maneja automáticamente: salto de página, repetición del encabezado en
 * cada página nueva (`showHead: 'everyPage'`) y ajuste del texto dentro
 * de cada celda (`overflow: 'linebreak'`) — nada de esto se implementa
 * a mano.
 */
export function downloadTablePdf<T>({
  fileName,
  title,
  subtitle,
  columns,
  items,
  landscape = true,
}: DownloadTablePdfOptions<T>): void {
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait' });

  doc.setFontSize(14);
  doc.text(title, 14, 18);

  let startY = 24;
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(112, 111, 111); // gris corporativo DOMIND
    doc.text(subtitle, 14, 24);
    doc.setTextColor(0, 0, 0);
    startY = 30;
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.label)],
    body: items.map((item) => columns.map((c) => c.getValue(item))),
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 74, 152] }, // azul corporativo DOMIND
    showHead: 'everyPage',
    margin: { top: 24 },
  });

  doc.save(fileName);
}

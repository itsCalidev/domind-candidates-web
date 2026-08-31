import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '@/shared/context/ToastContext';
import { useCandidateMutations } from './useCandidateMutations';

/**
 * Orquesta el flujo completo del reporte PDF generado en el cliente:
 * pedir el resumen (mutación, no query — es una acción explícita del
 * usuario, no algo que se precargue), esperar a que
 * CandidateReportTemplate lo pinte en el DOM oculto, rasterizarlo con
 * html2canvas y guardarlo con jsPDF. Ver CandidateReportTemplate.tsx
 * para el componente que este hook rasteriza.
 */
export function useCandidateReportPdf(candidateId: string | undefined) {
  const { getReportSummary } = useCandidateMutations();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);

  const reportData = getReportSummary.data ?? null;

  // Un useEffect normal alcanza: html2canvas no toma una captura de
  // pantalla, clona el nodo y lee getComputedStyle()/getBoundingClientRect()
  // para redibujar en un canvas — esas APIs fuerzan un reflow síncrono al
  // llamarlas, no dependen de que el navegador ya haya pintado un frame.
  // React garantiza que el commit (DOM real + refs) de un render termina
  // antes de que corra cualquier efecto de ese mismo render, así que para
  // cuando este efecto corre, containerRef.current ya refleja reportData.
  useEffect(() => {
    if (!reportData || !containerRef.current) return;
    const node = containerRef.current;
    const data = reportData;
    let cancelled = false;

    async function generate() {
      setIsRenderingPdf(true);
      // El alto contraste es una clase en <body> con reglas !important
      // (ver index.css) atadas a selectores de clase MUI, no a la
      // posición del elemento — un `left:-9999px` no exime a la
      // plantilla de esas reglas porque sigue siendo descendiente de
      // <body class="high-contrast">. Se quita justo antes de capturar
      // y se restaura de inmediato después.
      const hadHighContrast = document.body.classList.contains('high-contrast');
      if (hadHighContrast) document.body.classList.remove('high-contrast');
      try {
        await document.fonts.ready;
        const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        if (cancelled) return;
        // Página del PDF del mismo tamaño exacto que el canvas (no A3
        // con escalado): como ambos números son literalmente los
        // mismos, no hay aritmética de "ajustar a la página" que se
        // pueda equivocar — geométricamente no puede recortarse ni
        // deformarse. El contenedor ya no tiene alto fijo (ver
        // REPORT_MIN_HEIGHT_PX en CandidateReportTemplate), así que
        // canvas.height crece solo si el contenido (ej. un Resumen
        // Ejecutivo largo) lo necesita.
        // `orientation: 'landscape'` es obligatorio: sin él, jsPDF asume
        // 'portrait' por default y, como canvas.width (~1587×2 con el
        // scale) es mayor que canvas.height, intercambia los dos
        // números para forzar ancho<=alto — el PDF terminaba con una
        // página angosta y la imagen (dibujada con las medidas
        // originales) quedaba recortada.
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        // El folio sale de la respuesta, no de un prop aparte: ya viene
        // garantizado presente aquí (es el mismo dato que acaba de
        // resolver la mutación), sin depender de que el llamador lo
        // vuelva a pasar por fuera.
        doc.save(`Reporte_${data.folio}.pdf`);
      } catch {
        if (!cancelled) showToast('No se pudo generar el PDF del reporte.', 'error');
      } finally {
        if (hadHighContrast) document.body.classList.add('high-contrast');
        if (!cancelled) setIsRenderingPdf(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [reportData, showToast]);

  return {
    containerRef,
    reportData,
    isGeneratingReport: getReportSummary.isPending || isRenderingPdf,
    downloadReport: () => {
      if (!candidateId) return;
      getReportSummary.mutate(candidateId);
    },
  };
}

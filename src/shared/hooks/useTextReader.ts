import { useEffect, useRef, useState } from 'react';

const READER_ACTIVE_CLASS = 'reader-mode-active';
const HOVER_DEBOUNCE_MS = 150;
const READER_LANG = 'es-MX';

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Modo de lectura por hover: mientras está activo, pasar el mouse sobre
 * cualquier texto lo lee en voz alta con la Web Speech API nativa. Vive
 * fuera de AccessibilityContext a propósito — a diferencia de tamaño de
 * texto/alto contraste/modo oscuro, esta preferencia no persiste ni
 * aplica en /login, así que basta con un `useState` local en el
 * componente donde se usa (Header, que nunca se desmonta entre rutas).
 */
export function useTextReader() {
  const [isReaderActive, setIsReaderActive] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isReaderActive || !isSpeechSynthesisSupported()) return;

    document.body.classList.add(READER_ACTIVE_CLASS);

    function handleMouseOver(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        const text = target.textContent?.trim() ?? '';
        if (!text) return; // no leer contenedores vacíos

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = READER_LANG;
        window.speechSynthesis.speak(utterance);
      }, HOVER_DEBOUNCE_MS);
    }

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove(READER_ACTIVE_CLASS);
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, [isReaderActive]);

  function toggleReader() {
    setIsReaderActive((prev) => !prev);
  }

  return { isReaderActive, toggleReader };
}

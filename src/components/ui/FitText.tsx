import { useLayoutEffect, useRef } from 'react';

/**
 * Nombre corto que debe verse completo en una caja estrecha (los selectores de partida van en tres
 * columnas de 76–105 px en un teléfono). Primero en una línea, achicando la letra lo justo; si con un
 * 15 % menos aún no cabe y tiene espacios, pasa a dos líneas equilibradas ("México y / Centroamérica")
 * y solo achica si una palabra sola no cabe. `min` = tamaño mínimo relativo al de la clase.
 */
export default function FitText({ text, className = '', min = 0.7 }: { text: string; className?: string; min?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      el.style.whiteSpace = 'nowrap';
      const base = parseFloat(getComputedStyle(el).fontSize) || 13;
      const avail = el.clientWidth;
      if (!avail || !el.scrollWidth) return;
      let f = Math.min(1, avail / el.scrollWidth);
      if (f < 0.85 && text.includes(' ')) {
        el.style.whiteSpace = 'normal';
        f = Math.min(1, avail / el.scrollWidth);
      }
      if (f < 1) el.style.fontSize = `${Math.max(min, Math.floor(f * 100) / 100) * base}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);
    // Con la fuente de la marca ya cargada el texto mide distinto
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [text, min]);

  return <span ref={ref} className={`block overflow-hidden text-ellipsis [text-wrap:balance] ${className}`}>{text}</span>;
}

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Una línea que nunca se sale de su caja: si no cabe, se encoge entera (transform) lo justo. Pensado para la letra
 * grande de Android: el WebView agranda todo el texto según el tamaño de letra del teléfono, pero no las cajas, y el
 * nombre de la app o un título de una línea se cortaban ("GEOSPE", "Tu próxima aven…"). Se mide lo que de verdad se
 * dibuja, así que funciona con cualquier aumento de letra.
 *
 * @param align  desde dónde se encoge: 'start' (alineado a la izquierda) o 'center'
 * @param min    escala mínima
 */
export default function FitWidth({ children, className = '', align = 'start', min = 0.5 }: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center';
  min?: number;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; h: number | null; dx: number }>({ scale: 1, h: null, dx: 0 });

  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const avail = outer.clientWidth, natural = inner.scrollWidth, h = inner.offsetHeight;
      if (!avail || !natural) return;
      const scale = Math.max(min, Math.min(1, Math.floor((avail / natural) * 100) / 100));
      // Centrado: lo encogido se corre al centro (una caja más ancha que su línea empieza en el borde izquierdo)
      const dx = align === 'center' && scale < 1 ? Math.max(0, Math.round((avail - natural * scale) / 2)) : 0;
      setFit((f) => (f.scale === scale && f.h === h && f.dx === dx ? f : { scale, h, dx }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    let raf = 0;
    const onFonts = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    document.fonts?.addEventListener?.('loadingdone', onFonts);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); document.fonts?.removeEventListener?.('loadingdone', onFonts); };
  }, [min, align]);

  const shrunk = fit.scale < 1;
  return (
    // Sin flex en la caja de afuera: un hijo flex se estira a su alto y la medida se realimentaba hasta colapsar
    <div ref={outerRef} className={`min-w-0 w-full overflow-hidden ${align === 'center' && !shrunk ? 'text-center' : ''} ${className}`}
      style={shrunk && fit.h ? { height: Math.ceil(fit.h * fit.scale) } : undefined}>
      <div ref={innerRef} className="inline-block align-top whitespace-nowrap text-left"
        style={shrunk ? { transform: `translateX(${fit.dx}px) scale(${fit.scale})`, transformOrigin: 'top left' } : undefined}>
        {children}
      </div>
    </div>
  );
}

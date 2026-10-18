import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Escala su contenido para que quepa en el alto (y ancho) disponible, sin barras de desplazamiento.
 * Se usa en la tarjeta de respuesta de la partida: en un iPhone en horizontal el alto útil cambia mucho
 * entre modelos y con la barra del navegador, así que la tarjeta se ajusta sola a cada pantalla.
 *
 * @param maxScale  escala máxima (p.ej. 0.88 en celular para que siempre sea un poco más compacta)
 * @param origin    punto desde el que se encoge (la tarjeta va pegada a la derecha)
 */
export default function FitToBox({ children, maxScale = 1, minScale = 0.55, origin = 'top right', center = false, className = '' }: {
  children: ReactNode;
  maxScale?: number;
  minScale?: number;
  origin?: string;
  /** centrar verticalmente (tarjeta del computador) */
  center?: boolean;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxScale);

  useLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const h = inner.offsetHeight, w = inner.offsetWidth;
      const fit = Math.min(maxScale, h ? outer.clientHeight / h : 1, w ? outer.clientWidth / w : 1);
      setScale(Math.max(minScale, Math.floor(fit * 100) / 100));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [maxScale, minScale]);

  return (
    <div ref={outerRef} className={`relative w-full h-full min-h-0 flex flex-col ${center ? 'justify-center' : 'justify-start'} ${className}`}>
      <div ref={innerRef} className="w-full" style={{ transform: `scale(${scale})`, transformOrigin: origin }}>
        {children}
      </div>
    </div>
  );
}

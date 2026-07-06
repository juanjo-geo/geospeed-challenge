import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Duración de la animación en ms (default 500). */
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Formateador (default: toLocaleString). */
  format?: (n: number) => string;
}

/**
 * Contador que anima hacia arriba (count-up) con requestAnimationFrame + easeOutExpo,
 * en vez de saltar al valor final. Estilo Duolingo.
 */
export default function CountUp({ value, durationMs = 500, className, style, format }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  const fmt = format || ((n: number) => n.toLocaleString());
  return <span className={className} style={style}>{fmt(display)}</span>;
}

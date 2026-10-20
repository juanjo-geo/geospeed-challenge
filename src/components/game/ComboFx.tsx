import { useEffect, useRef, useState, useCallback } from 'react';
import { prefersReducedMotion } from '@/lib/prefs';
import { BRAND_RGB, rgba } from '@/lib/theme';

/** Color del combo por nivel: turquesa hasta ¡Turbo!, fuego en ¡EN LLAMAS! */
const FIRE_RGB = '255,138,61';
export const comboRgb = (level: number) => (level >= 4 ? FIRE_RGB : BRAND_RGB.turquoise);

/**
 * Efectos visuales del combo sobre el área del mapa (puntaje v2, especificación §7):
 * brillo en los bordes desde ×1,5 (crece con el nivel), destello en cada acierto, estela del cursor
 * desde ×2,0 (solo con mouse). El pulso, el leve zoom y el temblor los aplica el contenedor con
 * `useComboFx().fxClass`. Nada se dibuja con "reducir movimiento".
 */
export default function ComboFx({ level, hit, active = true }: { level: number; hit: number; active?: boolean }) {
  const reduce = prefersReducedMotion();
  const glow = level >= 2 && !reduce;
  const rgb = comboRgb(level);
  const alpha = level >= 4 ? 0.55 : level >= 3 ? 0.42 : 0.3;
  const spread = level >= 4 ? 34 : level >= 3 ? 26 : 18;
  return (
    <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0 transition-[box-shadow] duration-500"
        style={{ boxShadow: glow ? `inset 0 0 ${spread}px ${rgba(rgb, alpha)}, inset 0 0 ${spread * 2.6}px ${rgba(rgb, alpha * 0.45)}` : 'none' }}
      />
      {/* Destello en cada acierto con combo: se reinicia con `hit` */}
      {glow && hit > 0 && (
        <div key={hit} className="absolute inset-0 animate-combo-flash" style={{ boxShadow: `inset 0 0 ${spread * 1.6}px ${rgba(rgb, Math.min(0.85, alpha + 0.3))}` }} />
      )}
      {active && level >= 3 && !reduce && <CursorTrail rgb={rgb} />}
    </div>
  );
}

/** Estela detrás del cursor (¡Turbo! y ¡EN LLAMAS!): puntos que se desvanecen; solo con puntero fino */
function CursorTrail({ rgb }: { rgb: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement?.parentElement;
    if (!canvas || !host || !window.matchMedia('(pointer: fine)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pts: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      canvas.style.width = `${r.width}px`; canvas.style.height = `${r.height}px`;
    };
    resize();
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      if (pts.length > 40) pts.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const draw = () => {
      raf = 0;
      const now = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      while (pts.length && now - pts[0].t > 380) pts.shift();
      pts.forEach((p) => {
        const k = 1 - (now - p.t) / 380;
        ctx.fillStyle = `rgba(${rgb},${0.55 * k})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + 6 * k, 0, Math.PI * 2);
        ctx.fill();
      });
      if (pts.length) raf = requestAnimationFrame(draw);
    };
    host.addEventListener('pointermove', onMove);
    window.addEventListener('resize', resize);
    return () => {
      host.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [rgb]);
  return <canvas ref={ref} className="absolute inset-0" />;
}

/**
 * Clase temporal para el contenedor del mapa: pulso del fondo (¡Turbo!), leve zoom (¡EN LLAMAS!) o
 * temblor corto de 150 ms (combo roto). `fire` se llama en el mismo instante del clic.
 */
export function useComboFx() {
  const [fxClass, setFxClass] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fire = useCallback((level: number, broke: boolean, hit: boolean) => {
    if (prefersReducedMotion()) return;
    const cls = broke ? 'animate-combo-break' : hit && level >= 4 ? 'animate-combo-zoom' : hit && level >= 3 ? 'animate-combo-pulse' : '';
    if (!cls) return;
    clearTimeout(timer.current);
    setFxClass('');
    // Siguiente cuadro: así la animación se reinicia aunque se repita la misma clase
    requestAnimationFrame(() => setFxClass(cls));
    timer.current = setTimeout(() => setFxClass(''), 600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { fxClass, fire };
}

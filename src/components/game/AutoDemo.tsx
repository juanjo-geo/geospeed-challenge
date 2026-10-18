import { prefersReducedMotion } from '@/lib/prefs';
import { BRAND, BRAND_RGB, MAP_CONTINENT_COLORS } from '@/lib/theme';
import { getColorGroup } from '@/lib/mapContinents';
import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { countries } from '@/data/countries';
import { getMapBounds } from '@/data/cities';

/**
 * AutoDemo — A silent, looping 5-second visual demo that plays on the
 * HomeScreen to show new and returning players how the game works.
 *
 * Flow per cycle (~5s):
 *   0.0s  Map renders, city name fades in
 *   0.8s  Animated cursor moves to a click position
 *   1.5s  "Click" registers — ripple effect
 *   1.8s  Bezier arc draws from click to correct city
 *   3.0s  Score pops up (+800, +1000, etc.)
 *   4.0s  Everything fades out
 *   5.0s  New city, repeat
 */

interface DemoCity {
  name: string;
  lat: number;
  lon: number;
  clickLat: number;
  clickLon: number;
  score: number;
  emoji: string;
}

const HIT_CITIES: DemoCity[] = [
  { name: 'París', lat: 48.86, lon: 2.35, clickLat: 47.5, clickLon: 4.2, score: 800, emoji: '🔥' },
  { name: 'Tokio', lat: 35.68, lon: 139.69, clickLat: 36.5, clickLon: 137.0, score: 1000, emoji: '🎯' },
  { name: 'Buenos Aires', lat: -34.6, lon: -58.38, clickLat: -32.0, clickLon: -56.0, score: 500, emoji: '👏' },
  { name: 'El Cairo', lat: 30.04, lon: 31.24, clickLat: 28.5, clickLon: 33.0, score: 800, emoji: '🔥' },
  { name: 'Nueva York', lat: 40.71, lon: -74.01, clickLat: 41.5, clickLon: -72.0, score: 1000, emoji: '🎯' },
  { name: 'Sídney', lat: -33.87, lon: 151.21, clickLat: -35.0, clickLon: 149.0, score: 800, emoji: '🔥' },
  { name: 'Londres', lat: 51.51, lon: -0.13, clickLat: 50.0, clickLon: 1.5, score: 800, emoji: '🔥' },
  { name: 'Moscú', lat: 55.76, lon: 37.62, clickLat: 54.0, clickLon: 40.0, score: 500, emoji: '👏' },
  { name: 'Río de Janeiro', lat: -22.91, lon: -43.17, clickLat: -21.0, clickLon: -41.0, score: 800, emoji: '🔥' },
  { name: 'Mumbai', lat: 19.08, lon: 72.88, clickLat: 17.5, clickLon: 75.0, score: 500, emoji: '👏' },
  { name: 'Ciudad de México', lat: 19.43, lon: -99.13, clickLat: 20.5, clickLon: -97.0, score: 800, emoji: '🔥' },
  { name: 'Pekín', lat: 39.9, lon: 116.4, clickLat: 41.0, clickLon: 114.0, score: 800, emoji: '🔥' },
  { name: 'Nairobi', lat: -1.29, lon: 36.82, clickLat: 0.5, clickLon: 38.5, score: 500, emoji: '👏' },
  { name: 'Roma', lat: 41.9, lon: 12.5, clickLat: 40.5, clickLon: 14.0, score: 1000, emoji: '🎯' },
  { name: 'Estambul', lat: 41.01, lon: 28.98, clickLat: 39.5, clickLon: 31.0, score: 800, emoji: '🔥' },
];

// Fisher-Yates shuffle + pick 6 random cities per mount
function pickRandomCities(arr: DemoCity[], count: number): DemoCity[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// Ciudades "falladas": el click cae al otro lado del mundo → arco largo + puntaje bajo
const FAIL_CITIES: DemoCity[] = [
  { name: 'Tokio', lat: 35.68, lon: 139.69, clickLat: -34.6, clickLon: -58.38, score: 50, emoji: '🌍' },
  { name: 'Nueva York', lat: 40.71, lon: -74.01, clickLat: 22.0, clickLon: 88.0, score: 50, emoji: '🌍' },
  { name: 'El Cairo', lat: 30.04, lon: 31.24, clickLat: -40.0, clickLon: -71.0, score: 50, emoji: '🌍' },
  { name: 'Sídney', lat: -33.87, lon: 151.21, clickLat: 45.0, clickLon: -100.0, score: 50, emoji: '🌍' },
];

// Garantiza que aparezca UNA ciudad fallada (arco al otro lado del mundo) por sesión
function buildDemoSet(): DemoCity[] {
  const hits = pickRandomCities(HIT_CITIES, 5);
  const fail = FAIL_CITIES[Math.floor(Math.random() * FAIL_CITIES.length)];
  return pickRandomCities([...hits, fail], 6);
}

// Bounds recortados: sin océano vacío bajo ~-55 (el marco pega al mapa)
const DEMO_BOUNDS = { latMin: -56, latMax: 80, lonMin: -180, lonMax: 180 };

const DEMO_CITIES = buildDemoSet();

/** @param hideTagline oculta la frase "Velocidad + precisión" cuando el contenedor ya la muestra (banner de Inicio v2) */
export default function AutoDemo({ hideTagline = false }: { hideTagline?: boolean } = {}) {
  const { t, locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 320, h: 160 });
  const animRef = useRef<number>(0);
  const cycleRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        const aspect = (DEMO_BOUNDS.latMax - DEMO_BOUNDS.latMin) / (DEMO_BOUNDS.lonMax - DEMO_BOUNDS.lonMin);
        setSize({ w: Math.floor(width), h: Math.floor(width * aspect) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = DEMO_BOUNDS;
    const lonRange = bounds.lonMax - bounds.lonMin;
    const latRange = bounds.latMax - bounds.latMin;
    const CYCLE_MS = 5000;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = size.w;
    const h = size.h;

    const mScale = Math.min(w / lonRange, h / latRange);
    const mOffX = (w - lonRange * mScale) / 2;
    const mOffY = (h - latRange * mScale) / 2;
    const toX = (lon: number) => mOffX + (lon - bounds.lonMin) * mScale;
    const toY = (lat: number) => mOffY + (bounds.latMax - lat) * mScale;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    let startTime: number | null = null;

    const isNeon = true; // paleta única desde F0 (la clase neon es inerte)
    const isLight = false;
    const FONT = 'Poppins, system-ui, sans-serif';
    const fmt = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO');

    // Pin en forma de gota con la punta en (x, y) — amarillo = tu respuesta, turquesa = ciudad correcta (como en la partida)
    const drawPin = (x: number, y: number, color: string, r: number) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = r * 0.8;
      ctx.shadowOffsetY = r * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - r * 0.35, y - r * 0.9, x - r, y - r * 1.25, x - r, y - r * 2);
      ctx.arc(x, y - r * 2, r, Math.PI, 0, false);
      ctx.bezierCurveTo(x + r, y - r * 1.25, x + r * 0.35, y - r * 0.9, x, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = Math.max(1, r * 0.18);
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - r * 2, r * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    };

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) % (CYCLE_MS * DEMO_CITIES.length);
      const cityIdx = Math.floor(elapsed / CYCLE_MS) % DEMO_CITIES.length;
      const cycleT = (elapsed % CYCLE_MS) / CYCLE_MS;
      const city = DEMO_CITIES[cityIdx];

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Océano azul noche (como el mapa de la partida)
      const ocean = ctx.createLinearGradient(0, 0, 0, h);
      ocean.addColorStop(0, BRAND.navyDeep);
      ocean.addColorStop(0.5, BRAND.navy);
      ocean.addColorStop(1, BRAND.navyDeep);
      ctx.fillStyle = ocean;
      ctx.fillRect(0, 0, w, h);

      // Países con el color de su continente (maqueta Inicio v2) y bordes blancos finos
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 0.5;
      for (let ci = 0; ci < countries.length; ci++) {
        const country = countries[ci];
        const palette = MAP_CONTINENT_COLORS[getColorGroup(country.name)] ?? MAP_CONTINENT_COLORS.Ice;
        ctx.fillStyle = palette[ci % palette.length];
        for (const polygon of country.polygons) {
          if (polygon.length < 4) continue;
          ctx.beginPath();
          let vis = false;
          for (let i = 0; i < polygon.length; i++) {
            const x = toX(polygon[i][0]);
            const y = toY(polygon[i][1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            if (x >= -5 && x <= w + 5 && y >= -5 && y <= h + 5) vis = true;
          }
          if (vis) { ctx.closePath(); ctx.fill(); ctx.stroke(); }
        }
      }

      // City question mark (shows immediately)
      const cx = toX(city.lon);
      const cy = toY(city.lat);

      // Phase timings (normalized 0-1)
      const cursorMoveEnd = 0.3;
      const clickTime = 0.32;
      const arcDrawEnd = 0.6;
      const scoreShowStart = 0.62;
      const fadeStart = 0.85;

      // City name label (top)
      const nameAlpha = cycleT < 0.1 ? cycleT / 0.1 : cycleT > fadeStart ? Math.max(0, 1 - (cycleT - fadeStart) / (1 - fadeStart)) : 1;
      // "¿Dónde está " en blanco y la ciudad en amarillo, con sombra para leerse sobre el mapa
      ctx.globalAlpha = nameAlpha;
      ctx.font = `800 ${Math.max(15, w / 20)}px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const question = t('demo_whereIs', { city: city.name });
      const at = question.indexOf(city.name);
      const parts = at >= 0
        ? [question.slice(0, at), city.name, question.slice(at + city.name.length)]
        : [question, '', ''];
      const totalW = parts.reduce((s, part) => s + ctx.measureText(part).width, 0);
      let tx = (w - totalW) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 6;
      parts.forEach((part, i) => {
        if (!part) return;
        ctx.fillStyle = i === 1 ? BRAND.yellow : '#ffffff';
        ctx.fillText(part, tx, 6);
        tx += ctx.measureText(part).width;
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // Mensaje "¡Al otro lado del mundo!" cuando la localización falla (arco largo)
      if (city.score <= 50 && cycleT >= arcDrawEnd) {
        const mAlpha = cycleT > fadeStart ? Math.max(0, 1 - (cycleT - fadeStart) / (1 - fadeStart)) : 1;
        ctx.globalAlpha = mAlpha;
        ctx.font = `700 ${Math.max(11, w / 26)}px ${FONT}`;
        ctx.fillStyle = BRAND.coral;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(t('demo_otherSideWorld'), w / 2, 6 + Math.max(15, w / 20) + 3);
        ctx.globalAlpha = 1;
      }

      // Cursor position
      const ux = toX(city.clickLon);
      const uy = toY(city.clickLat);

      if (cycleT < cursorMoveEnd) {
        // Animated cursor moving
        const t = easeInOutQuad(cycleT / cursorMoveEnd);
        const startX = w * 0.5;
        const startY = h * 0.7;
        const curX = startX + (ux - startX) * t;
        const curY = startY + (uy - startY) * t;

        // Draw cursor
        ctx.fillStyle = isNeon ? BRAND.turquoise : '#4fc3f7';
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        ctx.lineTo(curX + 2, curY + 12);
        ctx.lineTo(curX + 6, curY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (cycleT >= clickTime) {
        // Click happened — show user dot
        const clickAge = (cycleT - clickTime) / (1 - clickTime);
        const dotAlpha = cycleT > fadeStart ? Math.max(0, 1 - (cycleT - fadeStart) / (1 - fadeStart)) : 1;

        // Ripple effect
        if (clickAge < 0.3) {
          const rippleR = 4 + clickAge / 0.3 * 20;
          ctx.globalAlpha = (1 - clickAge / 0.3) * 0.5 * dotAlpha;
          ctx.strokeStyle = isNeon ? BRAND.turquoise : '#4fc3f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ux, uy, rippleR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.globalAlpha = dotAlpha;
        const pinR = Math.max(4, w / 75);

        // Draw arc to correct city
        if (cycleT < arcDrawEnd) {
          const arcT = easeOutCubic((cycleT - clickTime) / (arcDrawEnd - clickTime));
          const mx = (ux + cx) / 2;
          const my = (uy + cy) / 2;
          const dx = cx - ux;
          const dy = cy - uy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const bulge = Math.min(dist * 0.15, 20);
          const cpx = mx - (dy / (dist || 1)) * bulge;
          const cpy = my + (dx / (dist || 1)) * bulge;

          // Gradient trail
          const steps = Math.max(Math.floor(arcT * 40), 2);
          for (let i = 0; i < steps - 1; i++) {
            const t0 = (i / steps) * arcT;
            const t1 = ((i + 1) / steps) * arcT;
            const u0 = 1 - t0;
            const u1 = 1 - t1;
            const p0 = { x: u0 * u0 * ux + 2 * u0 * t0 * cpx + t0 * t0 * cx, y: u0 * u0 * uy + 2 * u0 * t0 * cpy + t0 * t0 * cy };
            const p1 = { x: u1 * u1 * ux + 2 * u1 * t1 * cpx + t1 * t1 * cx, y: u1 * u1 * uy + 2 * u1 * t1 * cpy + t1 * t1 * cy };
            const alpha = 0.3 + 0.7 * (i / steps);
            ctx.strokeStyle = `rgba(255,255,255,${alpha * dotAlpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
        } else {
          // Arc complete — show correct city star
          const mx = (ux + cx) / 2;
          const my = (uy + cy) / 2;
          const dx = cx - ux;
          const dy = cy - uy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const bulge = Math.min(dist * 0.15, 20);
          const cpx = mx - (dy / (dist || 1)) * bulge;
          const cpy = my + (dx / (dist || 1)) * bulge;

          // Arco completo (línea punteada blanca, como en la maqueta)
          ctx.strokeStyle = `rgba(255,255,255,${0.85 * dotAlpha})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(ux, uy);
          ctx.quadraticCurveTo(cpx, cpy, cx, cy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ciudad correcta: pin turquesa
          drawPin(cx, cy, BRAND.turquoise, pinR);
        }
        ctx.setLineDash([]);
        // Tu respuesta: pin amarillo
        drawPin(ux, uy, BRAND.yellow, pinR);

        // Score popup
        if (cycleT >= scoreShowStart) {
          const scoreT = (cycleT - scoreShowStart) / (fadeStart - scoreShowStart);
          const popScale = scoreT < 0.3 ? easeOutCubic(scoreT / 0.3) : 1;
          const yOff = scoreT * -15;
          const scoreAlpha = dotAlpha * (scoreT < 0.3 ? scoreT / 0.3 : 1);

          ctx.globalAlpha = scoreAlpha;
          ctx.font = `800 ${Math.max(17, w / 15) * popScale}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = `+${fmt(city.score)}`;
          const fontPx = Math.max(17, w / 15);
          const titleBottom = 6 + Math.max(15, w / 20) + 4;
          // Nunca encima de la pregunta (ciudades del norte quedan cerca del borde superior)
          const sx = (ux + cx) / 2, sy = Math.max(titleBottom + fontPx * 0.6, (uy + cy) / 2 + yOff - pinR * 3);
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(3, w / 110);
          ctx.strokeStyle = `rgba(${BRAND_RGB.navyDeep},0.9)`;
          ctx.strokeText(label, sx, sy);
          ctx.fillStyle = city.score >= 500 ? BRAND.yellow : BRAND.coral;
          ctx.fillText(label, sx, sy);
        }

        ctx.globalAlpha = 1;
      }

      // Tagline velocidad + precisión — al pie del mapa (sobre el polo sur)
      if (!hideTagline) {
        ctx.globalAlpha = 0.92;
        ctx.font = `700 ${Math.max(10, w / 30)}px ${FONT}`;
        ctx.fillStyle = isNeon ? BRAND.yellow : isLight ? '#1a3a4a' : BRAND.yellow;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(t('demo_tagline'), w / 2, h - Math.max(16, w / 22));
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion()) {
      // Movimiento reducido: un solo cuadro (arco + puntaje) y sin bucle
      startTime = 1;
      animate(3001);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = 0;
      return;
    }
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [size, locale, t, hideTagline]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full block pointer-events-none"
        style={{ height: size.h }}
      />
    </div>
  );
}

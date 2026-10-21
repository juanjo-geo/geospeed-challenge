import { useEffect, useRef } from 'react';
import { countries } from '@/data/countries';
import { GLOBE, BRAND_RGB, rgba } from '@/lib/theme';
import { prefersReducedMotion } from '@/lib/prefs';

const DEG = Math.PI / 180;
const TILT = 18 * DEG;          // inclinación: se ve un poco más del hemisferio norte
const SPEED = 14;               // grados por segundo
const ICE = new Set(['Antarctica', 'Greenland']);

/** Punto dentro de polígono (lon/lat), por rayos */
function inPoly(lon: number, lat: number, poly: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Generador pseudoaleatorio con semilla: la textura es la misma en cada carga */
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

type Spot = { lon: number; lat: number; r: number; dark: boolean };
type Cloud = { lon: number; lat: number; r: number };

/** Manchas de relieve sobre tierra (claras y oscuras) y nubes, en coordenadas geográficas para que giren con el globo */
function buildTexture(): { spots: Spot[]; clouds: Cloud[] } {
  const rand = rng(20261018);
  const polys: { poly: number[][]; box: [number, number, number, number] }[] = [];
  for (const c of countries) {
    if (ICE.has(c.name)) continue;
    for (const poly of c.polygons) {
      if (poly.length < 4) continue;
      let a = 180, b = -180, cMin = 90, d = -90;
      for (const [lon, lat] of poly) { a = Math.min(a, lon); b = Math.max(b, lon); cMin = Math.min(cMin, lat); d = Math.max(d, lat); }
      polys.push({ poly, box: [a, b, cMin, d] });
    }
  }
  const spots: Spot[] = [];
  for (let i = 0; i < 2600 && spots.length < 520; i++) {
    const lon = rand() * 360 - 180;
    const lat = rand() * 135 - 58;
    const hit = polys.some(p => lon >= p.box[0] && lon <= p.box[1] && lat >= p.box[2] && lat <= p.box[3] && inPoly(lon, lat, p.poly));
    if (hit) spots.push({ lon, lat, r: 1.2 + rand() * 3.2, dark: rand() < 0.55 });
  }
  const clouds: Cloud[] = [];
  for (let i = 0; i < 16; i++) {
    const lon = rand() * 360 - 180, lat = rand() * 120 - 55;
    const n = 3 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) clouds.push({ lon: lon + (rand() - 0.5) * 9, lat: lat + (rand() - 0.5) * 4, r: 2.5 + rand() * 3 });
  }
  return { spots, clouds };
}

/**
 * Globo terráqueo girando en proyección ortográfica, dibujado con los mismos polígonos del mapa.
 * Sustituye la ilustración de la maqueta de carga sin añadir imágenes.
 */
export default function SplashGlobe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const still = prefersReducedMotion();
    const rot0 = -60 * DEG; // empieza mostrando América y Europa/África
    let raf = 0;
    let size = 0;
    const resize = () => {
      const css = canvas.getBoundingClientRect().width;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      size = Math.max(1, Math.round(css * dpr));
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    const ro = new ResizeObserver(() => { resize(); if (still) draw(rot0); });
    ro.observe(canvas);

    const sinT = Math.sin(TILT), cosT = Math.cos(TILT);
    const { spots, clouds } = buildTexture();

    const draw = (lambda0: number) => {
      const R = size / 2 - 1;
      if (R <= 0) return; // lienzo aún sin tamaño (oculto o sin maquetar)
      const cx = size / 2, cy = size / 2;
      ctx.clearRect(0, 0, size, size);

      // Océano con luz desde arriba a la izquierda
      const ocean = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      ocean.addColorStop(0, GLOBE.oceanLight);
      ocean.addColorStop(1, GLOBE.oceanDeep);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Tierra: puntos del lado oculto se proyectan sobre el horizonte. Un tono por país y borde de costa.
      ctx.strokeStyle = GLOBE.coast;
      ctx.lineWidth = Math.max(1, size * 0.0025);
      ctx.lineJoin = 'round';
      for (let ci = 0; ci < countries.length; ci++) {
        const country = countries[ci];
        ctx.fillStyle = ICE.has(country.name) ? GLOBE.ice : GLOBE.landTones[ci % GLOBE.landTones.length];
        for (const poly of country.polygons) {
          let anyVisible = false;
          ctx.beginPath();
          for (let i = 0; i < poly.length; i++) {
            const lon = poly[i][0] * DEG, lat = poly[i][1] * DEG;
            const dl = lon - lambda0;
            const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
            let x = cosLat * Math.sin(dl);
            let y = cosT * sinLat - sinT * cosLat * Math.cos(dl);
            const cosC = sinT * sinLat + cosT * cosLat * Math.cos(dl);
            if (cosC >= 0) anyVisible = true;
            else { const n = Math.hypot(x, y) || 1; x /= n; y /= n; }
            const px = cx + x * R, py = cy - y * R;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          if (anyVisible) { ctx.closePath(); ctx.fill(); ctx.stroke(); }
        }
      }

      // Proyección de un punto (null si está en la cara oculta)
      const proj = (lonDeg: number, latDeg: number) => {
        const lon = lonDeg * DEG, lat = latDeg * DEG;
        const dl = lon - lambda0;
        const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
        const cosC = sinT * sinLat + cosT * cosLat * Math.cos(dl);
        if (cosC <= 0.05) return null;
        return { x: cx + cosLat * Math.sin(dl) * R, y: cy - (cosT * sinLat - sinT * cosLat * Math.cos(dl)) * R, k: cosC };
      };

      // Relieve: manchas suaves de bosque (oscuras) y zonas claras, achatadas hacia el borde
      for (const s of spots) {
        const p = proj(s.lon, s.lat);
        if (!p) continue;
        const rr = (s.r * DEG) * R;
        ctx.globalAlpha = (s.dark ? 0.3 : 0.26) * Math.min(1, p.k * 1.4);
        ctx.fillStyle = s.dark ? GLOBE.landDark : GLOBE.landLight;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr, rr * Math.max(0.35, p.k), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Nubes blancas difusas (como en la maqueta)
      for (const c of clouds) {
        const p = proj(c.lon, c.lat);
        if (!p) continue;
        const rr = (c.r * DEG) * R;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        g.addColorStop(0, `rgba(255,255,255,${0.55 * Math.min(1, p.k * 1.3)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr, rr * Math.max(0.4, p.k), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Volumen: sombra hacia abajo a la derecha y brillo arriba a la izquierda
      const shade = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.2, cx, cy, R * 1.05);
      shade.addColorStop(0, 'rgba(255,255,255,0.18)');
      shade.addColorStop(0.55, 'rgba(255,255,255,0)');
      shade.addColorStop(1, rgba(BRAND_RGB.navyDeep, 0.55));
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // Borde de atmósfera turquesa
      ctx.beginPath();
      ctx.arc(cx, cy, R - size * 0.006, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(BRAND_RGB.turquoise, 0.55);
      ctx.lineWidth = size * 0.012;
      ctx.stroke();
    };

    if (still) {
      draw(rot0);
    } else {
      const start = performance.now();
      let last = 0;
      const loop = (now: number) => {
        // ~30 fps basta para un giro lento y ahorra batería en celulares
        if (now - last > 32) {
          last = now;
          draw(rot0 + ((now - start) / 1000) * SPEED * DEG);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className={`block w-full aspect-square ${className}`} aria-hidden />;
}

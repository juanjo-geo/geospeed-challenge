import { useEffect, useRef } from 'react';
import { countries } from '@/data/countries';
import { GLOBE, BRAND_RGB, rgba } from '@/lib/theme';
import { prefersReducedMotion } from '@/lib/prefs';

const DEG = Math.PI / 180;
const TILT = 18 * DEG;          // inclinación: se ve un poco más del hemisferio norte
const SPEED = 14;               // grados por segundo
const ICE = new Set(['Antarctica', 'Greenland']);

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

    const draw = (lambda0: number) => {
      const R = size / 2 - 1;
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

      // Tierra: puntos del lado oculto se proyectan sobre el horizonte
      for (const country of countries) {
        ctx.fillStyle = ICE.has(country.name) ? GLOBE.ice : GLOBE.land;
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
          if (anyVisible) { ctx.closePath(); ctx.fill(); }
        }
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

import { useEffect, useRef } from 'react';
import { countries } from '@/data/countries';
import { GLOBE, BRAND, MAP_CONTINENT_COLORS } from '@/lib/theme';
import { getColorGroup } from '@/lib/mapContinents';

/**
 * Mapa del mundo plano dibujado con los polígonos del juego, como fondo decorativo
 * (maquetas Cuenta regresiva y Girar). Se importa con React.lazy: trae los ~100 KB de polígonos
 * y no debe entrar en la carga inicial.
 *  - tone "faint": continentes verdes muy tenues sobre el fondo (cuenta regresiva).
 *  - tone "vivid": océano azul y tierra verde brillante (pantallas de los teléfonos de Girar).
 *  - tone "continents": colores de continente del juego, apagados (fondo del cierre de partida).
 *  - tone "night": continentes azules tenues (fondo de las pantallas de Cuenta).
 */
const BOUNDS = { lonMin: -180, lonMax: 180, latMin: -58, latMax: 84 };

export default function WorldBackdrop({ tone = 'faint', className = '' }: { tone?: 'faint' | 'vivid' | 'continents' | 'night'; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (tone === 'vivid') {
        const ocean = ctx.createLinearGradient(0, 0, w, h);
        ocean.addColorStop(0, GLOBE.oceanDeep);
        ocean.addColorStop(1, BRAND.navyDeep);
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, w, h);
      }

      const lonRange = BOUNDS.lonMax - BOUNDS.lonMin;
      const latRange = BOUNDS.latMax - BOUNDS.latMin;
      const scale = Math.min(w / lonRange, h / latRange);
      const offX = (w - lonRange * scale) / 2;
      const offY = (h - latRange * scale) / 2;
      const toX = (lon: number) => offX + (lon - BOUNDS.lonMin) * scale;
      const toY = (lat: number) => offY + (BOUNDS.latMax - lat) * scale;

      ctx.fillStyle = tone === 'vivid' ? GLOBE.land : tone === 'night' ? GLOBE.nightLand : 'rgba(70, 165, 95, 0.22)';
      ctx.strokeStyle = tone === 'vivid' ? 'rgba(255,255,255,0.55)' : tone === 'night' ? GLOBE.nightCoast : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = tone === 'vivid' ? 0.4 : 0.6;
      for (let ci = 0; ci < countries.length; ci++) {
        const country = countries[ci];
        if (country.name === 'Antarctica') continue;
        if (tone === 'continents') {
          const pal = MAP_CONTINENT_COLORS[getColorGroup(country.name)] ?? MAP_CONTINENT_COLORS.Ice;
          ctx.fillStyle = pal[ci % pal.length];
        }
        for (const poly of country.polygons) {
          if (poly.length < 3) continue;
          ctx.beginPath();
          for (let i = 0; i < poly.length; i++) {
            const x = toX(poly[i][0]), y = toY(poly[i][1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [tone]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} aria-hidden />;
}

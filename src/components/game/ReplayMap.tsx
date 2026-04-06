import { useRef, useEffect, useState } from 'react';
import { countries } from '@/data/countries';
import { type GameMode, getMapBounds } from '@/data/cities';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';
import { useA11y } from '@/contexts/AccessibilityContext';

interface ReplayMapProps {
  rounds: RoundResult[];
  gameMode: GameMode;
}

/**
 * Mini-map that replays all rounds of a completed game, showing
 * each click→city connection with color-coded accuracy.
 */
export default function ReplayMap({ rounds, gameMode }: ReplayMapProps) {
  const { palette } = useA11y();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 220 });
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);

  const bounds = getMapBounds(gameMode);
  const lonRange = bounds.lonMax - bounds.lonMin;
  const latRange = bounds.latMax - bounds.latMin;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        const h = Math.round(width * 0.55);
        setSize({ w: Math.floor(width), h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rounds.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = size.w;
    const h = size.h;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const scale = Math.min(w / lonRange, h / latRange);
    const offX = (w - lonRange * scale) / 2;
    const offY = (h - latRange * scale) / 2;
    const toX = (lon: number) => offX + (lon - bounds.lonMin) * scale;
    const toY = (lat: number) => offY + (bounds.latMax - lat) * scale;

    const light = document.documentElement.classList.contains('light');

    // Ocean
    ctx.fillStyle = light ? '#B0D8EC' : '#E8D8BC';
    ctx.fillRect(0, 0, w, h);

    // Simplified country fills
    ctx.fillStyle = light ? '#D8E8D0' : '#C8A060';
    ctx.strokeStyle = light ? '#8899AA55' : '#2A140855';
    ctx.lineWidth = 0.5;
    for (const country of countries) {
      for (const polygon of country.polygons) {
        if (polygon.length < 3) continue;
        ctx.beginPath();
        let vis = false;
        for (let i = 0; i < polygon.length; i++) {
          const x = toX(polygon[i][0]);
          const y = toY(polygon[i][1]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          if (x >= -10 && x <= w + 10 && y >= -10 && y <= h + 10) vis = true;
        }
        if (vis) {
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Draw each round's click→city arc
    const getColor = (dist: number) => {
      if (dist < 200) return palette.good.hex;
      if (dist < 500) return palette.medium.hex;
      if (dist < 1000) return palette.warn.hex;
      return palette.bad.hex;
    };

    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const ux = toX(r.clickLon);
      const uy = toY(r.clickLat);
      const cx = toX(r.city.lon);
      const cy = toY(r.city.lat);
      const color = getColor(r.distance);
      const isHovered = hoveredRound === i;

      // Arc control point
      const mx = (ux + cx) / 2;
      const my = (uy + cy) / 2;
      const dx = cx - ux;
      const dy = cy - uy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bulge = Math.min(dist * 0.18, 30);
      const cpx = mx - (dy / (dist || 1)) * bulge;
      const cpy = my + (dx / (dist || 1)) * bulge;

      // Arc line
      ctx.strokeStyle = isHovered ? color : color + '99';
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.quadraticCurveTo(cpx, cpy, cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Click dot (player guess)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ux, uy, isHovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Target dot (correct city)
      ctx.fillStyle = '#f5c842';
      ctx.beginPath();
      ctx.arc(cx, cy, isHovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Round number label near target
      if (isHovered) {
        const label = `#${i + 1} ${r.city.name} — ${formatDistance(r.distance)}`;
        ctx.font = 'bold 10px system-ui';
        const tw = ctx.measureText(label).width;
        const lx = cx + 8;
        const ly = cy - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx - 4, ly - 8, tw + 8, 16, 4);
        else ctx.rect(lx - 4, ly - 8, tw + 8, 16);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      } else {
        ctx.font = 'bold 8px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, cx, cy);
      }
    }

    // Legend
    const legendY = h - 12;
    const legendItems = [
      { label: '< 200 km', color: palette.good.hex },
      { label: '< 500 km', color: palette.medium.hex },
      { label: '< 1000 km', color: palette.warn.hex },
      { label: '> 1000 km', color: palette.bad.hex },
    ];
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let lx = 8;
    for (const item of legendItems) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(lx + 4, legendY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = light ? '#333' : '#fff';
      ctx.fillText(item.label, lx + 10, legendY);
      lx += ctx.measureText(item.label).width + 20;
    }
  }, [size, rounds, gameMode, bounds, lonRange, latRange, hoveredRound, palette]);

  // Handle hover on canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const scale = Math.min(size.w / lonRange, size.h / latRange);
    const offX = (size.w - lonRange * scale) / 2;
    const offY = (size.h - latRange * scale) / 2;
    const toX = (lon: number) => offX + (lon - bounds.lonMin) * scale;
    const toY = (lat: number) => offY + (bounds.latMax - lat) * scale;

    let closest = -1;
    let closestDist = 20; // px threshold
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      // Check distance to both click point and city point
      for (const pt of [
        { x: toX(r.clickLon), y: toY(r.clickLat) },
        { x: toX(r.city.lon), y: toY(r.city.lat) },
      ]) {
        const d = Math.sqrt((mx - pt.x) ** 2 + (my - pt.y) ** 2);
        if (d < closestDist) {
          closestDist = d;
          closest = i;
        }
      }
    }
    setHoveredRound(closest >= 0 ? closest : null);
  };

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg cursor-crosshair"
        style={{ height: size.h }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredRound(null)}
      />
    </div>
  );
}

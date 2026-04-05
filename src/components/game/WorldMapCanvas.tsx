import { useRef, useEffect, useCallback, useState } from 'react';
import { countries } from '@/data/countries';
import { type GameMode, getMapBounds } from '@/data/cities';

interface WorldMapCanvasProps {
  onMapClick: (lat: number, lon: number) => void;
  clickDisabled?: boolean;
  userClick?: { lat: number; lon: number } | null;
  correctLocation?: { lat: number; lon: number } | null;
  distanceKm?: number | null;
  gameMode?: GameMode;
  hintZone?: { lat: number; lon: number } | null;
}

export default function WorldMapCanvas({
  onMapClick,
  clickDisabled = false,
  userClick,
  correctLocation,
  distanceKm,
  gameMode = 'world',
  hintZone,
}: WorldMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 450 });
  const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 2));
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  const bounds = getMapBounds(gameMode);
  const lonRange = bounds.lonMax - bounds.lonMin;
  const latRange = bounds.latMax - bounds.latMin;

  const lonToX = useCallback((lon: number) => ((lon - bounds.lonMin) / lonRange) * dimensions.w, [dimensions.w, bounds.lonMin, lonRange]);
  const latToY = useCallback((lat: number) => ((bounds.latMax - lat) / latRange) * dimensions.h, [dimensions.h, bounds.latMax, latRange]);
  const xToLon = useCallback((x: number) => (x / dimensions.w) * lonRange + bounds.lonMin, [dimensions.w, bounds.lonMin, lonRange]);
  const yToLat = useCallback((y: number) => bounds.latMax - (y / dimensions.h) * latRange, [dimensions.h, bounds.latMax, latRange]);

  // Political map palette inspired by reference
  const MAP_PALETTE = [
    '#F4A460', '#FF8C00', '#66CDAA', '#FFD700', '#32CD32',
    '#DA70D6', '#FF6347', '#C0C0C0', '#FFA500', '#8B4513',
    '#20B2AA', '#ADFF2F', '#FF4500', '#BA55D3', '#FFFF00',
    '#CD5C5C', '#4169E1', '#FF69B4', '#FFD700', '#90EE90',
  ];

  const drawBaseMap = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Ocean — gradient from light to deeper blue
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0, '#5BC0EB');
    oceanGrad.addColorStop(0.35, '#3DA8D8');
    oceanGrad.addColorStop(0.7, '#2B8BBE');
    oceanGrad.addColorStop(1, '#1A6F9E');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Countries with vibrant rotating palette
    for (let ci = 0; ci < countries.length; ci++) {
      const country = countries[ci];
      ctx.fillStyle = MAP_PALETTE[ci % MAP_PALETTE.length];
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      for (const polygon of country.polygons) {
        ctx.beginPath();
        let hasVisiblePoint = false;
        for (let i = 0; i < polygon.length; i++) {
          const pLon = polygon[i][0];
          const pLat = polygon[i][1];
          const x = ((pLon - bounds.lonMin) / lonRange) * w;
          const y = ((bounds.latMax - pLat) / latRange) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          if (pLon >= bounds.lonMin - 20 && pLon <= bounds.lonMax + 20 &&
              pLat >= bounds.latMin - 20 && pLat <= bounds.latMax + 20) {
            hasVisiblePoint = true;
          }
        }
        if (hasVisiblePoint) {
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Graticule
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    const lonStep = gameMode === 'world' ? 30 : 10;
    const latStep = gameMode === 'world' ? 30 : 10;
    for (let lon = Math.ceil(bounds.lonMin / lonStep) * lonStep; lon <= bounds.lonMax; lon += lonStep) {
      const x = ((lon - bounds.lonMin) / lonRange) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = Math.ceil(bounds.latMin / latStep) * latStep; lat <= bounds.latMax; lat += latStep) {
      const y = ((bounds.latMax - lat) / latRange) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Labels based on mode
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (gameMode === 'world') {
      const fontSize = Math.max(9, Math.round(w / 100));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = '#000000';
      const continents = [
        { name: 'AMÉRICA\nDEL NORTE', lat: 45, lon: -100 },
        { name: 'AMÉRICA\nDEL SUR', lat: -15, lon: -58 },
        { name: 'EUROPA', lat: 54, lon: 15 },
        { name: 'ÁFRICA', lat: 5, lon: 20 },
        { name: 'ASIA', lat: 45, lon: 85 },
        { name: 'OCEANÍA', lat: -25, lon: 135 },
        { name: 'ANTÁRTIDA', lat: -82, lon: 0 },
      ];
      for (const c of continents) {
        const x = ((c.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - c.lat) / latRange) * h;
        const lines = c.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }

      ctx.fillStyle = '#000000';
      ctx.font = `bold italic ${Math.max(8, Math.round(w / 120))}px system-ui`;
      const oceans = [
        { name: 'OCÉANO PACÍFICO', lat: 5, lon: -150 },
        { name: 'OCÉANO ATLÁNTICO', lat: 15, lon: -35 },
        { name: 'OCÉANO ÍNDICO', lat: -20, lon: 75 },
        { name: 'OCÉANO PACÍFICO', lat: 5, lon: 170 },
        { name: 'OCÉANO ÁRTICO', lat: 80, lon: 0 },
      ];
      for (const o of oceans) {
        const x = ((o.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - o.lat) / latRange) * h;
        ctx.fillText(o.name, x, y);
      }
    } else if (gameMode === 'europe') {
      const fontSize = Math.max(10, Math.round(w / 70));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = '#000000';
      const labels = [
        { name: 'OCÉANO\nATLÁNTICO', lat: 50, lon: -18 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 36, lon: 15 },
        { name: 'MAR DEL\nNORTE', lat: 58, lon: 3 },
        { name: 'MAR\nBÁLTICO', lat: 58, lon: 20 },
        { name: 'MAR\nNEGRO', lat: 43, lon: 35 },
      ];
      for (const l of labels) {
        const x = ((l.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - l.lat) / latRange) * h;
        const lines = l.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
    } else if (gameMode === 'asia') {
      const fontSize = Math.max(10, Math.round(w / 70));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = '#000000';
      const labels = [
        { name: 'OCÉANO\nÍNDICO', lat: -5, lon: 75 },
        { name: 'OCÉANO\nPACÍFICO', lat: 25, lon: 140 },
        { name: 'MAR\nARÁBIGO', lat: 15, lon: 62 },
        { name: 'MAR DE\nCHINA', lat: 15, lon: 115 },
        { name: 'MAR DE\nJAPÓN', lat: 40, lon: 135 },
        { name: 'GOLFO\nPÉRSICO', lat: 27, lon: 51 },
      ];
      for (const l of labels) {
        const x = ((l.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - l.lat) / latRange) * h;
        const lines = l.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
    } else if (gameMode === 'africa') {
      const fontSize = Math.max(10, Math.round(w / 70));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = '#000000';
      const labels = [
        { name: 'ÁFRICA\nDEL NORTE', lat: 30, lon: 10 },
        { name: 'ÁFRICA\nOCCIDENTAL', lat: 10, lon: -8 },
        { name: 'ÁFRICA\nORIENTAL', lat: 0, lon: 38 },
        { name: 'ÁFRICA\nCENTRAL', lat: 0, lon: 18 },
        { name: 'ÁFRICA\nAUSTRAL', lat: -25, lon: 25 },
        { name: 'OCÉANO\nATLÁNTICO', lat: 5, lon: -20 },
        { name: 'OCÉANO\nÍNDICO', lat: -15, lon: 52 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 37, lon: 18 },
        { name: 'MAR\nROJO', lat: 20, lon: 40 },
      ];
      for (const l of labels) {
        const x = ((l.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - l.lat) / latRange) * h;
        const lines = l.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
    } else if (gameMode === 'americas') {
      const fontSize = Math.max(10, Math.round(w / 70));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.fillStyle = '#000000';
      const labels = [
        { name: 'AMÉRICA\nDEL NORTE', lat: 50, lon: -105 },
        { name: 'AMÉRICA\nCENTRAL', lat: 15, lon: -85 },
        { name: 'AMÉRICA\nDEL SUR', lat: -20, lon: -58 },
        { name: 'OCÉANO\nPACÍFICO', lat: 10, lon: -155 },
        { name: 'OCÉANO\nATLÁNTICO', lat: 20, lon: -38 },
        { name: 'MAR\nCARIBE', lat: 18, lon: -72 },
      ];
      for (const l of labels) {
        const x = ((l.lon - bounds.lonMin) / lonRange) * w;
        const y = ((bounds.latMax - l.lat) / latRange) * h;
        const lines = l.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
    }
  }, [gameMode, bounds, lonRange, latRange]);

  // Resize handler
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Build offscreen cache at high DPI
  useEffect(() => {
    const dpr = dprRef.current;
    const offscreen = document.createElement('canvas');
    offscreen.width = dimensions.w * dpr;
    offscreen.height = dimensions.h * dpr;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      drawBaseMap(ctx, dimensions.w, dimensions.h);
    }
    offscreenRef.current = offscreen;
  }, [dimensions, drawBaseMap]);

  // Animated line progress
  const lineProgressRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // Render with animated line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = dprRef.current;

    // Cancel any previous animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (!userClick || !correctLocation) {
      // Static render
      canvas.width = dimensions.w * dpr;
      canvas.height = dimensions.h * dpr;
      canvas.style.width = `${dimensions.w}px`;
      canvas.style.height = `${dimensions.h}px`;
      ctx.scale(dpr, dpr);
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0, dimensions.w, dimensions.h);
      lineProgressRef.current = 0;
      return;
    }

    const ux = lonToX(userClick.lon);
    const uy = latToY(userClick.lat);
    const cx = lonToX(correctLocation.lon);
    const cy = latToY(correctLocation.lat);

    const lineDuration = 2000; // 2s to draw the line
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / lineDuration, 1);
      lineProgressRef.current = progress;

      canvas.width = dimensions.w * dpr;
      canvas.height = dimensions.h * dpr;
      canvas.style.width = `${dimensions.w}px`;
      canvas.style.height = `${dimensions.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0, dimensions.w, dimensions.h);

      // User pin (always visible)
      ctx.fillStyle = '#4fc3f7';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ux, uy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Animated line
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentX = ux + (cx - ux) * eased;
      const currentY = uy + (cy - uy) * eased;

      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Show correct pin and distance label only when line is complete
      if (progress >= 1) {
        // Draw the complete line
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Correct pin
        drawStar(ctx, cx, cy, 5, 10, 5);

        if (distanceKm != null) {
          const mx = (ux + cx) / 2;
          const my = (uy + cy) / 2;
          const text = `${Math.round(distanceKm).toLocaleString()} km`;
          ctx.font = 'bold 13px system-ui';
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(mx - tw / 2 - 6, my - 10, tw + 12, 20);
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, mx, my);
        }
      } else {
        // Growing dot at line tip
        ctx.fillStyle = '#f5c842';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();

        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, userClick, correctLocation, distanceKm, lonToX, latToY]);

  // Training mode: pulsing hint zone animation (runs only when hintZone is set and user hasn't clicked)
  const hintAnimFrameRef = useRef<number>(0);
  useEffect(() => {
    if (!hintZone || userClick) {
      if (hintAnimFrameRef.current) cancelAnimationFrame(hintAnimFrameRef.current);
      return;
    }
    if (!offscreenRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = dprRef.current;

    const hx = lonToX(hintZone.lon);
    const hy = latToY(hintZone.lat);
    // Radius as a proportion of map width (~16° for world, ~9° for regional)
    const radiusDeg = gameMode === 'world' ? 16 : 9;
    const radiusPx = (radiusDeg / lonRange) * dimensions.w;

    let startTime: number | null = null;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) % 3000;
      const phase = elapsed / 3000;
      const pulse = Math.sin(phase * Math.PI * 2);
      const alpha = 0.13 + 0.07 * pulse;
      const scale = 0.93 + 0.07 * pulse;

      canvas.width = dimensions.w * dpr;
      canvas.height = dimensions.h * dpr;
      canvas.style.width = `${dimensions.w}px`;
      canvas.style.height = `${dimensions.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0, dimensions.w, dimensions.h);

      // Radial gradient glow
      const outerR = radiusPx * (scale + 0.15);
      const grad = ctx.createRadialGradient(hx, hy, outerR * 0.3, hx, hy, outerR);
      grad.addColorStop(0, `rgba(245, 200, 66, ${alpha * 1.4})`);
      grad.addColorStop(0.6, `rgba(245, 200, 66, ${alpha})`);
      grad.addColorStop(1, 'rgba(245, 200, 66, 0)');
      ctx.beginPath();
      ctx.arc(hx, hy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Dashed border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, radiusPx * scale, 0, Math.PI * 2);
      ctx.setLineDash([10, 7]);
      ctx.strokeStyle = `rgba(245, 200, 66, ${0.55 + 0.2 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // "?" label at center
      const fontSize = Math.max(14, Math.round(dimensions.w / 40));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(245, 200, 66, ${0.7 + 0.2 * pulse})`;
      ctx.fillText('?', hx, hy);

      hintAnimFrameRef.current = requestAnimationFrame(animate);
    };

    hintAnimFrameRef.current = requestAnimationFrame(animate);
    return () => { if (hintAnimFrameRef.current) cancelAnimationFrame(hintAnimFrameRef.current); };
  }, [hintZone, userClick, dimensions, lonToX, latToY, gameMode, lonRange]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (clickDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onMapClick(yToLat(y), xToLon(x));
  }, [clickDisabled, onMapClick, xToLon, yToLat]);

  // Auto-zoom to midpoint — adaptive based on viewport size and point distance
  useEffect(() => {
    if (!userClick || !correctLocation || !containerRef.current) {
      return;
    }

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const midLon = (userClick.lon + correctLocation.lon) / 2;
    const midLat = (userClick.lat + correctLocation.lat) / 2;
    const xPercent = ((midLon - bounds.lonMin) / lonRange) * 100;
    const yPercent = ((bounds.latMax - midLat) / latRange) * 100;

    // Adaptive zoom: scale based on viewport width and distance between points
    const vw = window.innerWidth;
    const pointSpreadX = Math.abs(userClick.lon - correctLocation.lon) / lonRange;
    const pointSpreadY = Math.abs(userClick.lat - correctLocation.lat) / latRange;
    const pointSpread = Math.max(pointSpreadX, pointSpreadY);

    // Base zoom by viewport: smaller screens get less zoom
    let baseZoom: number;
    if (vw < 640) baseZoom = 1.15;       // compact/mobile
    else if (vw < 1025) baseZoom = 1.35;  // medium/tablet
    else baseZoom = 1.6;                   // wide/desktop

    // Reduce zoom if points are far apart (so both stay visible)
    // If points span > 30% of the map, reduce zoom proportionally
    const spreadPenalty = pointSpread > 0.3 ? Math.max(0.6, 1 - (pointSpread - 0.3)) : 1;
    const zoomLevel = Math.max(1.05, baseZoom * spreadPenalty);

    // Shorter animation on mobile
    const zoomInDuration = vw < 640 ? 3000 : 6000;
    const zoomOutDelay = vw < 640 ? 3500 : 6500;

    const zoomInTimer = setTimeout(() => {
      setZoomStyle({
        transform: `scale(${zoomLevel})`,
        transformOrigin: `${xPercent}% ${yPercent}%`,
        transition: `transform ${zoomInDuration}ms cubic-bezier(0.16, 1, 0.3, 1), transform-origin ${zoomInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      });
    }, 300);

    const zoomOutTimer = setTimeout(() => {
      setZoomStyle({
        transform: 'scale(1)',
        transformOrigin: `${xPercent}% ${yPercent}%`,
        transition: 'transform 2000ms cubic-bezier(0.16, 1, 0.3, 1), transform-origin 2000ms cubic-bezier(0.16, 1, 0.3, 1)',
      });
    }, zoomOutDelay);

    return () => {
      clearTimeout(zoomInTimer);
      clearTimeout(zoomOutTimer);
    };
  }, [userClick, correctLocation, bounds, lonRange, latRange]);

  // Reset zoom when markers clear
  useEffect(() => {
    if (!userClick && !correctLocation) {
      setZoomStyle({
        transform: 'scale(1)',
        transformOrigin: '50% 50%',
        transition: 'transform 4000ms cubic-bezier(0.16, 1, 0.3, 1), transform-origin 4000ms cubic-bezier(0.16, 1, 0.3, 1)',
      });
    }
  }, [userClick, correctLocation]);
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ minHeight: '50dvh', aspectRatio: '16 / 9' }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchEnd={(e) => {
          // Prevent double-fire on touch devices; onClick handles it
          // but we need touch-action CSS to prevent browser gestures
        }}
        className={`w-full h-full ${clickDisabled ? 'cursor-default' : 'cursor-crosshair'}`}
        style={{ display: 'block', touchAction: 'none', ...zoomStyle }}
      />
    </div>
  );
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  ctx.fillStyle = '#f5c842';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

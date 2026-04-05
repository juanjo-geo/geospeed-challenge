import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import { countries } from '@/data/countries';
import { type GameMode, getMapBounds } from '@/data/cities';
import { unlockAudio } from '@/lib/sounds';

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
  // Raw container size tracked by ResizeObserver
  const [containerSize, setContainerSize] = useState({ w: 800, h: 450 });
  const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 2));
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  const bounds = getMapBounds(gameMode);
  const lonRange = bounds.lonMax - bounds.lonMin;
  const latRange = bounds.latMax - bounds.latMin;

  // Canvas fills the entire container. Geographic content is centered within it
  // using a uniform scale (equirectangular). Extra space shows ocean + grid.
  const dimensions = containerSize;

  // Uniform scale: fit the geographic bounds inside the container, then center.
  const scale = Math.min(dimensions.w / lonRange, dimensions.h / latRange);
  const offsetX = (dimensions.w - lonRange * scale) / 2;
  const offsetY = (dimensions.h - latRange * scale) / 2;

  const lonToX = useCallback((lon: number) => offsetX + (lon - bounds.lonMin) * scale, [offsetX, bounds.lonMin, scale]);
  const latToY = useCallback((lat: number) => offsetY + (bounds.latMax - lat) * scale, [offsetY, bounds.latMax, scale]);
  const xToLon = useCallback((x: number) => (x - offsetX) / scale + bounds.lonMin, [offsetX, bounds.lonMin, scale]);
  const yToLat = useCallback((y: number) => bounds.latMax - (y - offsetY) / scale, [offsetY, bounds.latMax, scale]);

  // Reactively detect theme changes so the map redraws when toggled
  const theme = useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains('light') ? 'light' : 'dark',
  );
  const isLightMode = () => theme === 'light';

  // Dark mode: vivid flat political map (inspired by colorful atlas reference)
  const MAP_PALETTE_DARK = [
    '#5ABFCC', // cyan blue  (Canada / large countries)
    '#8B1A52', // dark maroon (Russia-tone)
    '#E03888', // hot pink / magenta
    '#F0C820', // bright yellow
    '#F07030', // orange
    '#3A7888', // dark teal
    '#C040A0', // magenta-purple
    '#68C8D8', // light cyan
    '#F07858', // coral / salmon (Australia-tone)
    '#4A5E6A', // dark slate blue-gray
    '#A038A8', // purple
    '#3870D0', // bright blue
    '#C03030', // red
    '#88B828', // yellow-green
    '#28988A', // medium teal
    '#F09030', // amber
    '#7838A8', // violet
    '#D05060', // deep rose
    '#38A050', // medium green
    '#D05898', // rose-pink
  ];

  // Light mode: soft pastel political map — inspired by classic atlas reference
  const MAP_PALETTE_LIGHT = [
    '#C8DFA0', // soft yellow-green
    '#F2C882', // peach/orange
    '#EBB8C4', // soft rose/pink
    '#C8D8F0', // powder blue
    '#F2E080', // soft yellow
    '#B8D8C8', // sage green
    '#EAC89A', // warm sand/tan
    '#D2C0E8', // soft lavender
    '#A8D8C4', // mint teal
    '#F0D4A0', // golden beige
    '#D4E8A8', // light lime
    '#F2B8A4', // soft salmon
    '#BCE4E8', // sky teal
    '#E8D4B8', // cream
    '#C4D898', // olive green
    '#F4C4CC', // blush rose
    '#D0E0A4', // yellow-green
    '#DEC0D8', // mauve
    '#B8D4A4', // muted green
    '#F0DCAC', // warm ivory
  ];

  // Helper: convert geo coords to pixel coords for drawBaseMap (uses closure over scale/offset)
  const geoToPixel = useCallback((lon: number, lat: number) => ({
    x: offsetX + (lon - bounds.lonMin) * scale,
    y: offsetY + (bounds.latMax - lat) * scale,
  }), [offsetX, offsetY, bounds.lonMin, bounds.latMax, scale]);

  const drawBaseMap = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const light = isLightMode();
    const MAP_PALETTE = light ? MAP_PALETTE_LIGHT : MAP_PALETTE_DARK;

    // Ocean fills the ENTIRE canvas (no letterbox gaps)
    if (light) {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#C8E8F4');
      oceanGrad.addColorStop(0.4, '#B0D8EC');
      oceanGrad.addColorStop(0.8, '#98C8E4');
      oceanGrad.addColorStop(1, '#84B8DC');
      ctx.fillStyle = oceanGrad;
    } else {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#5CD0DC');
      oceanGrad.addColorStop(0.5, '#48C0CC');
      oceanGrad.addColorStop(1, '#38B0BC');
      ctx.fillStyle = oceanGrad;
    }
    ctx.fillRect(0, 0, w, h);

    // ── Two-pass rendering to eliminate sub-pixel gaps at country borders ──
    // Pass 1: Fill all polygons.
    for (let ci = 0; ci < countries.length; ci++) {
      const country = countries[ci];
      ctx.fillStyle = MAP_PALETTE[ci % MAP_PALETTE.length];
      for (const polygon of country.polygons) {
        ctx.beginPath();
        let hasVisiblePoint = false;
        for (let i = 0; i < polygon.length; i++) {
          const { x, y } = geoToPixel(polygon[i][0], polygon[i][1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          if (x >= -50 && x <= w + 50 && y >= -50 && y <= h + 50) {
            hasVisiblePoint = true;
          }
        }
        if (hasVisiblePoint) {
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    // Pass 2: Stroke all borders on top of the fills.
    ctx.strokeStyle = light ? '#8899AA' : '#1a2a34';
    ctx.lineWidth = 1.2;
    for (let ci = 0; ci < countries.length; ci++) {
      const country = countries[ci];
      for (const polygon of country.polygons) {
        ctx.beginPath();
        let hasVisiblePoint = false;
        for (let i = 0; i < polygon.length; i++) {
          const { x, y } = geoToPixel(polygon[i][0], polygon[i][1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          if (x >= -50 && x <= w + 50 && y >= -50 && y <= h + 50) {
            hasVisiblePoint = true;
          }
        }
        if (hasVisiblePoint) {
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // Graticule — extends across the ENTIRE canvas, not just geographic bounds
    ctx.strokeStyle = light ? 'rgba(60,90,110,0.18)' : 'rgba(0,20,30,0.35)';
    ctx.lineWidth = 0.8;
    const lonStep = gameMode === 'world' ? 30 : 10;
    const latStep = gameMode === 'world' ? 30 : 10;
    // Calculate visible lon/lat range from canvas edges
    const visLonMin = bounds.lonMin - offsetX / scale;
    const visLonMax = bounds.lonMin + (w - offsetX) / scale;
    const visLatMax = bounds.latMax + offsetY / scale;
    const visLatMin = bounds.latMax - (h - offsetY) / scale;
    for (let lon = Math.floor(visLonMin / lonStep) * lonStep; lon <= visLonMax; lon += lonStep) {
      const x = offsetX + (lon - bounds.lonMin) * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = Math.floor(visLatMin / latStep) * latStep; lat <= visLatMax; lat += latStep) {
      const y = offsetY + (bounds.latMax - lat) * scale;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Labels based on mode — use geoToPixel for positioning
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const drawLabels = (labels: { name: string; lat: number; lon: number }[], fontSize: number, italic = false) => {
      ctx.font = `bold ${italic ? 'italic ' : ''}${fontSize}px system-ui`;
      ctx.fillStyle = light ? '#1a3a4a' : 'rgba(255,255,255,0.75)';
      for (const l of labels) {
        const { x, y } = geoToPixel(l.lon, l.lat);
        const lines = l.name.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
    };

    if (gameMode === 'world') {
      const fontSize = Math.max(9, Math.round(w / 100));
      drawLabels([
        { name: 'AMÉRICA\nDEL NORTE', lat: 45, lon: -100 },
        { name: 'AMÉRICA\nDEL SUR', lat: -15, lon: -58 },
        { name: 'EUROPA', lat: 54, lon: 15 },
        { name: 'ÁFRICA', lat: 5, lon: 20 },
        { name: 'ASIA', lat: 45, lon: 85 },
        { name: 'OCEANÍA', lat: -25, lon: 135 },
        { name: 'ANTÁRTIDA', lat: -82, lon: 0 },
      ], fontSize);
      drawLabels([
        { name: 'OCÉANO PACÍFICO', lat: 5, lon: -150 },
        { name: 'OCÉANO ATLÁNTICO', lat: 15, lon: -35 },
        { name: 'OCÉANO ÍNDICO', lat: -20, lon: 75 },
        { name: 'OCÉANO PACÍFICO', lat: 5, lon: 170 },
        { name: 'OCÉANO ÁRTICO', lat: 80, lon: 0 },
      ], Math.max(8, Math.round(w / 120)), true);
    } else if (gameMode === 'europe') {
      drawLabels([
        { name: 'OCÉANO\nATLÁNTICO', lat: 50, lon: -18 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 36, lon: 15 },
        { name: 'MAR DEL\nNORTE', lat: 58, lon: 3 },
        { name: 'MAR\nBÁLTICO', lat: 58, lon: 20 },
        { name: 'MAR\nNEGRO', lat: 43, lon: 35 },
      ], Math.max(10, Math.round(w / 70)));
    } else if (gameMode === 'asia') {
      drawLabels([
        { name: 'OCÉANO\nÍNDICO', lat: -5, lon: 75 },
        { name: 'OCÉANO\nPACÍFICO', lat: 25, lon: 140 },
        { name: 'MAR\nARÁBIGO', lat: 15, lon: 62 },
        { name: 'MAR DE\nCHINA', lat: 15, lon: 115 },
        { name: 'MAR DE\nJAPÓN', lat: 40, lon: 135 },
        { name: 'GOLFO\nPÉRSICO', lat: 27, lon: 51 },
      ], Math.max(10, Math.round(w / 70)));
    } else if (gameMode === 'africa') {
      drawLabels([
        { name: 'ÁFRICA\nDEL NORTE', lat: 30, lon: 10 },
        { name: 'ÁFRICA\nOCCIDENTAL', lat: 10, lon: -8 },
        { name: 'ÁFRICA\nORIENTAL', lat: 0, lon: 38 },
        { name: 'ÁFRICA\nCENTRAL', lat: 0, lon: 18 },
        { name: 'ÁFRICA\nAUSTRAL', lat: -25, lon: 25 },
        { name: 'OCÉANO\nATLÁNTICO', lat: 5, lon: -20 },
        { name: 'OCÉANO\nÍNDICO', lat: -15, lon: 52 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 37, lon: 18 },
        { name: 'MAR\nROJO', lat: 20, lon: 40 },
      ], Math.max(10, Math.round(w / 70)));
    } else if (gameMode === 'americas') {
      drawLabels([
        { name: 'AMÉRICA\nDEL NORTE', lat: 50, lon: -105 },
        { name: 'AMÉRICA\nCENTRAL', lat: 15, lon: -85 },
        { name: 'AMÉRICA\nDEL SUR', lat: -20, lon: -58 },
        { name: 'OCÉANO\nPACÍFICO', lat: 10, lon: -155 },
        { name: 'OCÉANO\nATLÁNTICO', lat: 20, lon: -38 },
        { name: 'MAR\nCARIBE', lat: 18, lon: -72 },
      ], Math.max(10, Math.round(w / 70)));
    }
  }, [gameMode, bounds, lonRange, latRange, theme, scale, offsetX, offsetY, geoToPixel]);

  // Resize handler — observes the outer container and tracks its raw size.
  // The actual canvas dimensions (geo-ratio-correct) are derived from containerSize above.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ w: Math.floor(width), h: Math.floor(height) });
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
    const radiusPx = radiusDeg * scale;

    // Theme-aware hint color:
    // dark mode → vivid red  #e03030 (visible against dark ocean/land)
    // light mode → vivid teal-green #00a08f (primary de la paleta tropical)
    const isLight = theme === 'light';
    const hintRGB = isLight ? '0, 160, 143' : '224, 48, 48';

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
      grad.addColorStop(0, `rgba(${hintRGB}, ${alpha * 1.6})`);
      grad.addColorStop(0.6, `rgba(${hintRGB}, ${alpha})`);
      grad.addColorStop(1, `rgba(${hintRGB}, 0)`);
      ctx.beginPath();
      ctx.arc(hx, hy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Dashed border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, radiusPx * scale, 0, Math.PI * 2);
      ctx.setLineDash([10, 7]);
      ctx.strokeStyle = `rgba(${hintRGB}, ${0.65 + 0.25 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // "?" label at center
      const fontSize = Math.max(14, Math.round(dimensions.w / 40));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${hintRGB}, ${0.8 + 0.2 * pulse})`;
      ctx.fillText('?', hx, hy);

      hintAnimFrameRef.current = requestAnimationFrame(animate);
    };

    hintAnimFrameRef.current = requestAnimationFrame(animate);
    return () => { if (hintAnimFrameRef.current) cancelAnimationFrame(hintAnimFrameRef.current); };
  }, [hintZone, userClick, dimensions, lonToX, latToY, gameMode, lonRange, theme, scale]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Unlock audio on first tap/click — required for iOS Safari Web Audio
    unlockAudio();
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
    const xPercent = (lonToX(midLon) / dimensions.w) * 100;
    const yPercent = (latToY(midLat) / dimensions.h) * 100;

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
  }, [userClick, correctLocation, bounds, lonRange, latRange, lonToX, latToY, dimensions]);

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
  // Ocean background colors — must match exactly what drawBaseMap paints as ocean.
  // This makes letterbox areas (when geo ratio ≠ container ratio) visually seamless:
  // the "empty" space around the canvas looks like ocean instead of a black bar.
  const oceanBg = theme === 'light'
    ? 'linear-gradient(180deg, #C8E8F4 0%, #98C8E4 50%, #84B8DC 100%)'
    : 'linear-gradient(180deg, #5CD0DC 0%, #48C0CC 50%, #38B0BC 100%)';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '50dvh', background: oceanBg }}
    >
      {/* Canvas fills entire container — ocean + grid extend to all edges */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchEnd={() => {
          // touch-action: none (set in style) prevents browser pan/zoom gestures
        }}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: clickDisabled ? 'default' : 'crosshair',
          ...zoomStyle,
        }}
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

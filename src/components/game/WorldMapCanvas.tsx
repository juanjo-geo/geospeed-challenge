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
  /** Continent name to subtly highlight as a visual hint (e.g. 'Europe', 'Asia') */
  highlightContinent?: string | null;
}

// ── Continent → country mapping (ISO-style names matching countries.ts) ──
const CONTINENT_COUNTRIES: Record<string, Set<string>> = {
  Europe: new Set(['Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herz.','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo','Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco','Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal','Romania','Russia','San Marino','Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland','Ukraine','United Kingdom','Vatican']),
  Asia: new Set(['Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','Brunei','Cambodia','China','Georgia','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North Korea','Oman','Pakistan','Palestine','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Syria','Taiwan','Tajikistan','Thailand','Timor-Leste','Turkey','Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen']),
  Africa: new Set(['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Cape Verde','Central African Rep.','Chad','Comoros','Congo','Côte d\'Ivoire','Dem. Rep. Congo','Djibouti','Egypt','Eq. Guinea','Eritrea','eSwatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','São Tomé and Príncipe','Senegal','Seychelles','Sierra Leone','Somalia','Somaliland','South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','W. Sahara','Zambia','Zimbabwe']),
  Americas: new Set(['Antigua and Barb.','Argentina','Bahamas','Barbados','Belize','Bolivia','Brazil','Canada','Chile','Colombia','Costa Rica','Cuba','Dominica','Dominican Rep.','Ecuador','El Salvador','Grenada','Guatemala','Guyana','Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama','Paraguay','Peru','Puerto Rico','St. Kitts and Nevis','St. Lucia','St. Vin. and Gren.','Suriname','Trinidad and Tobago','United States of America','Uruguay','Venezuela','Falkland Is.']),
  Oceania: new Set(['Australia','Fiji','Kiribati','Marshall Is.','Micronesia','Nauru','New Caledonia','New Zealand','Palau','Papua New Guinea','Samoa','Solomon Is.','Tonga','Tuvalu','Vanuatu']),
};

function getCountryContinent(name: string): string | null {
  for (const [continent, set] of Object.entries(CONTINENT_COUNTRIES)) {
    if (set.has(name)) return continent;
  }
  return null;
}

export default function WorldMapCanvas({
  onMapClick,
  clickDisabled = false,
  userClick,
  correctLocation,
  distanceKm,
  gameMode = 'world',
  hintZone,
  highlightContinent,
}: WorldMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Raw container size tracked by ResizeObserver
  const [containerSize, setContainerSize] = useState({ w: 800, h: 450 });
  const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 2));
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  // ── Pinch-to-zoom state ──
  const [pinchZoom, setPinchZoom] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);
  const pinchResetTimer = useRef<ReturnType<typeof setTimeout>>();

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

  // Dark mode: warm earth tones inspired by watercolor atlas reference
  const MAP_PALETTE_DARK = [
    '#D4A060', // golden amber
    '#C07848', // terracotta
    '#B84030', // deep rust
    '#E8C070', // warm gold
    '#C86040', // burnt orange
    '#A89060', // warm tan
    '#A03028', // deep red-brown
    '#DEB870', // amber wheat
    '#C86048', // coral terracotta
    '#D4B070', // light gold
    '#B86838', // orange-brown
    '#E0B868', // pale honey
    '#C07840', // medium terracotta
    '#983820', // dark sienna
    '#D89860', // warm sand
    '#B05038', // brick red
    '#E0A850', // golden amber light
    '#C88058', // caramel
    '#905030', // deep sienna
    '#D8B068', // honey gold
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
      // Cream/bone ocean — matches warm earth-tone watercolor palette
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#EDE0C8');
      oceanGrad.addColorStop(0.5, '#E8D8BC');
      oceanGrad.addColorStop(1, '#E0CEB0');
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
    ctx.strokeStyle = light ? '#8899AA' : '#2A1408';
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

    // ── Continent highlight overlay (#20) ──
    if (highlightContinent) {
      const continentCountries = CONTINENT_COUNTRIES[highlightContinent];
      if (continentCountries) {
        for (let ci = 0; ci < countries.length; ci++) {
          const country = countries[ci];
          const inContinent = continentCountries.has(country.name);
          if (inContinent) {
            // Bright subtle highlight
            ctx.fillStyle = light ? 'rgba(0,150,255,0.12)' : 'rgba(245,200,66,0.15)';
            for (const polygon of country.polygons) {
              ctx.beginPath();
              let vis = false;
              for (let i = 0; i < polygon.length; i++) {
                const { x, y } = geoToPixel(polygon[i][0], polygon[i][1]);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                if (x >= -50 && x <= w + 50 && y >= -50 && y <= h + 50) vis = true;
              }
              if (vis) { ctx.closePath(); ctx.fill(); }
            }
          } else {
            // Dim non-continent countries
            ctx.fillStyle = light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
            for (const polygon of country.polygons) {
              ctx.beginPath();
              let vis = false;
              for (let i = 0; i < polygon.length; i++) {
                const { x, y } = geoToPixel(polygon[i][0], polygon[i][1]);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                if (x >= -50 && x <= w + 50 && y >= -50 && y <= h + 50) vis = true;
              }
              if (vis) { ctx.closePath(); ctx.fill(); }
            }
          }
        }
      }
    }

    // Graticule — extends across the ENTIRE canvas, not just geographic bounds
    ctx.strokeStyle = light ? 'rgba(60,90,110,0.18)' : 'rgba(100,70,30,0.20)';
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
      ctx.fillStyle = light ? '#1a3a4a' : 'rgba(80,50,20,0.60)';
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
  }, [gameMode, bounds, lonRange, latRange, theme, scale, offsetX, offsetY, geoToPixel, highlightContinent]);

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

      // ── Curved arc control point (offset perpendicular to midpoint) ──
      const mx = (ux + cx) / 2;
      const my = (uy + cy) / 2;
      const dx = cx - ux;
      const dy = cy - uy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bulge = Math.min(dist * 0.2, 60); // arc curvature
      // perpendicular offset
      const cpx = mx - (dy / (dist || 1)) * bulge;
      const cpy = my + (dx / (dist || 1)) * bulge;

      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Helper: get point on quadratic bezier at t
      const bezierPt = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * ux + 2 * u * t * cpx + t * t * cx,
          y: u * u * uy + 2 * u * t * cpy + t * t * cy,
        };
      };

      // ── Gradient trail line (drawn portion) ──
      const steps = Math.max(Math.floor(eased * 80), 2);
      for (let i = 0; i < steps - 1; i++) {
        const t0 = (i / steps) * eased;
        const t1 = ((i + 1) / steps) * eased;
        const p0 = bezierPt(t0);
        const p1 = bezierPt(t1);
        const alpha = 0.3 + 0.7 * (i / steps); // fade in along trail
        ctx.strokeStyle = `rgba(245,200,66,${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      // ── Thin dashed guide from tip to destination (preview) ──
      if (progress < 1) {
        const tip = bezierPt(eased);
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.quadraticCurveTo(cpx, cpy, cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── User pin (always visible, pulsing ring) ──
      const pulse = 1 + 0.15 * Math.sin(elapsed * 0.004);
      ctx.fillStyle = '#4fc3f7';
      ctx.strokeStyle = 'rgba(79,195,247,0.3)';
      ctx.lineWidth = 3 * pulse;
      ctx.beginPath();
      ctx.arc(ux, uy, 8 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ux, uy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Show correct pin and distance label only when line is complete
      if (progress >= 1) {
        // Correct pin (gold star)
        drawStar(ctx, cx, cy, 5, 10, 5);

        // ── Distance label on arc midpoint ──
        if (distanceKm != null) {
          const labelPt = bezierPt(0.5);
          const text = `${Math.round(distanceKm).toLocaleString()} km`;
          ctx.font = 'bold 13px system-ui';
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          const bx = labelPt.x - tw / 2 - 8;
          const by = labelPt.y - 12;
          const bw = tw + 16;
          const bh = 24;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bx, by, bw, bh, 6);
          } else {
            ctx.rect(bx, by, bw, bh);
          }
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, labelPt.x, labelPt.y);
        }
      } else {
        // ── Glowing dot at line tip ──
        const tip = bezierPt(eased);
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 12);
        glow.addColorStop(0, 'rgba(245,200,66,0.9)');
        glow.addColorStop(0.5, 'rgba(245,200,66,0.3)');
        glow.addColorStop(1, 'rgba(245,200,66,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2);
        ctx.fill();
        // solid core
        ctx.fillStyle = '#f5c842';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
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

    // Vivid green — visible in BOTH dark (earth tones) and light (pastels) modes
    const hintRGB = '0, 210, 87'; // #00D257 — bright green

    let startTime: number | null = null;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) % 3000;
      const phase = elapsed / 3000;
      const pulse = Math.sin(phase * Math.PI * 2);
      const pulsedScale = 0.93 + 0.07 * pulse;

      canvas.width = dimensions.w * dpr;
      canvas.height = dimensions.h * dpr;
      canvas.style.width = `${dimensions.w}px`;
      canvas.style.height = `${dimensions.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (offscreenRef.current) ctx.drawImage(offscreenRef.current, 0, 0, dimensions.w, dimensions.h);

      const outerR = radiusPx * (pulsedScale + 0.15);

      // 1. White backdrop circle — prevents red/terracotta countries from bleeding through
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fill();
      ctx.restore();

      // 2. Green radial gradient glow on top
      const grad = ctx.createRadialGradient(hx, hy, outerR * 0.2, hx, hy, outerR);
      grad.addColorStop(0, `rgba(${hintRGB}, 0.45)`);
      grad.addColorStop(0.55, `rgba(${hintRGB}, 0.22)`);
      grad.addColorStop(1, `rgba(${hintRGB}, 0)`);
      ctx.beginPath();
      ctx.arc(hx, hy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 3. Dashed border ring — clearly green
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, radiusPx * pulsedScale, 0, Math.PI * 2);
      ctx.setLineDash([10, 7]);
      ctx.strokeStyle = `rgba(${hintRGB}, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 4. "?" label — white outline + green fill so it pops on any background
      const fontSize = Math.max(16, Math.round(dimensions.w / 36));
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText('?', hx, hy);
      ctx.fillStyle = `rgba(${hintRGB}, 1)`;
      ctx.fillText('?', hx, hy);

      hintAnimFrameRef.current = requestAnimationFrame(animate);
    };

    hintAnimFrameRef.current = requestAnimationFrame(animate);
    return () => { if (hintAnimFrameRef.current) cancelAnimationFrame(hintAnimFrameRef.current); };
  }, [hintZone, userClick, dimensions, lonToX, latToY, gameMode, lonRange, theme, scale]);

  // ── Pinch-to-zoom touch handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = pinchZoom;
      // Set origin as midpoint of the two fingers
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * 100;
        const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * 100;
        setPinchOrigin({ x: mx, y: my });
      }
      if (pinchResetTimer.current) clearTimeout(pinchResetTimer.current);
    }
  }, [pinchZoom]);

  const handleTouchMoveRef = useRef((_e: TouchEvent) => {});
  handleTouchMoveRef.current = (e: TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current > 0) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.min(4, Math.max(1, pinchStartZoom.current * (dist / pinchStartDist.current)));
      setPinchZoom(newZoom);
    }
  };

  // Attach touchmove as non-passive so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: TouchEvent) => handleTouchMoveRef.current(e);
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDist.current = 0;
    // Auto-reset zoom after 5s of no interaction
    if (pinchResetTimer.current) clearTimeout(pinchResetTimer.current);
    pinchResetTimer.current = setTimeout(() => {
      setPinchZoom(1);
      setPinchOrigin({ x: 50, y: 50 });
    }, 5000);
  }, []);

  // ── Mouse wheel zoom (desktop) — non-passive native listener ──
  const wheelHandlerRef = useRef((_e: WheelEvent) => {});
  wheelHandlerRef.current = (e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = (e.clientX - rect.left) / rect.width * 100;
      const my = (e.clientY - rect.top) / rect.height * 100;
      setPinchOrigin({ x: mx, y: my });
    }
    setPinchZoom(prev => {
      const newZoom = Math.min(4, Math.max(1, prev - e.deltaY * 0.002));
      return newZoom;
    });
    if (pinchResetTimer.current) clearTimeout(pinchResetTimer.current);
    pinchResetTimer.current = setTimeout(() => {
      setPinchZoom(1);
      setPinchOrigin({ x: 50, y: 50 });
    }, 5000);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => wheelHandlerRef.current(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Unlock audio on first tap/click — required for iOS Safari Web Audio
    unlockAudio();
    if (clickDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Adjust for pinch zoom
    const adjustedX = (x - rect.width * pinchOrigin.x / 100) / pinchZoom + rect.width * pinchOrigin.x / 100;
    const adjustedY = (y - rect.height * pinchOrigin.y / 100) / pinchZoom + rect.height * pinchOrigin.y / 100;
    onMapClick(yToLat(adjustedY), xToLon(adjustedX));
  }, [clickDisabled, onMapClick, xToLon, yToLat, pinchZoom, pinchOrigin]);

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
    : 'linear-gradient(180deg, #EDE0C8 0%, #E8D8BC 50%, #E0CEB0 100%)';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '50dvh', background: oceanBg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas fills entire container — ocean + grid extend to all edges */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        role="img"
        aria-label="Mapa mundial interactivo. Haz clic para colocar tu respuesta."
        tabIndex={0}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: clickDisabled ? 'default' : 'crosshair',
          // Combine auto-zoom (result) and pinch zoom (user)
          transform: pinchZoom > 1
            ? `scale(${pinchZoom})`
            : zoomStyle.transform || 'scale(1)',
          transformOrigin: pinchZoom > 1
            ? `${pinchOrigin.x}% ${pinchOrigin.y}%`
            : (zoomStyle.transformOrigin as string) || '50% 50%',
          transition: pinchZoom > 1
            ? 'transform 0.1s ease-out'
            : (zoomStyle.transition as string) || 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Zoom indicator */}
      {pinchZoom > 1.05 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-1 rounded-full pointer-events-none">
          {pinchZoom.toFixed(1)}x
        </div>
      )}
      {/* Mini-map for regional modes */}
      {gameMode !== 'world' && !userClick && (
        <MiniMap gameMode={gameMode} />
      )}
    </div>
  );
}

/** Mini-map inset for regional modes — shows where the region is on the globe */
function MiniMap({ gameMode }: { gameMode: GameMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionBounds = getMapBounds(gameMode);
  const worldBounds = getMapBounds('world');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // World background
    ctx.fillStyle = 'rgba(30,60,80,0.9)';
    ctx.fillRect(0, 0, w, h);

    const wLonRange = worldBounds.lonMax - worldBounds.lonMin;
    const wLatRange = worldBounds.latMax - worldBounds.latMin;
    const sx = w / wLonRange;
    const sy = h / wLatRange;
    const toX = (lon: number) => (lon - worldBounds.lonMin) * sx;
    const toY = (lat: number) => (worldBounds.latMax - lat) * sy;

    // Simplified continents outline
    ctx.fillStyle = 'rgba(120,150,120,0.5)';
    for (const country of countries) {
      for (const polygon of country.polygons) {
        if (polygon.length < 4) continue; // skip tiny islands
        ctx.beginPath();
        for (let i = 0; i < polygon.length; i++) {
          const x = toX(polygon[i][0]);
          const y = toY(polygon[i][1]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Region highlight box
    const rx = toX(regionBounds.lonMin);
    const ry = toY(regionBounds.latMax);
    const rw = (regionBounds.lonMax - regionBounds.lonMin) * sx;
    const rh = (regionBounds.latMax - regionBounds.latMin) * sy;

    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245,200,66,0.12)';
    ctx.fillRect(rx, ry, rw, rh);
  }, [gameMode, regionBounds, worldBounds]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={65}
      className="absolute bottom-2 left-2 rounded-lg border border-white/20 shadow-lg pointer-events-none"
      style={{ opacity: 0.85, width: 120, height: 65 }}
    />
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

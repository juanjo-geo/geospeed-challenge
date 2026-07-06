import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import { countries } from '@/data/countries';
import { type GameMode, getMapBounds } from '@/data/cities';
import { unlockAudio } from '@/lib/sounds';

interface WorldMapCanvasProps {
  onMapClick: (lat: number, lon: number, viewportX?: number, viewportY?: number) => void;
  clickDisabled?: boolean;
  userClick?: { lat: number; lon: number } | null;
  correctLocation?: { lat: number; lon: number } | null;
  distanceKm?: number | null;
  gameMode?: GameMode;
  hintZone?: { lat: number; lon: number } | null;
  /** Continent name to subtly highlight as a visual hint (e.g. 'Europe', 'Asia') */
  highlightContinent?: string | null;
  /** Callback with live lat/lon as cursor moves over the map */
  onCursorMove?: (lat: number, lon: number) => void;
  /** Equipped pin cosmetic config (fill/stroke/glow/size) */
  pinConfig?: { fill?: string; stroke?: string; glow?: string; size?: number } | null;
  /** Si se define, dibuja este emoji como pin del usuario (ej. balón ⚽ del modo Mundial) */
  pinEmoji?: string | null;
  /** Pinta el fondo (mar y bordes) de verde grama, para el modo Mundial. */
  fieldGreen?: boolean;
  /** Equipped trail cosmetic config (color as 'r,g,b' or colors[] for rainbow) */
  trailConfig?: { color?: string; colors?: string[]; width?: number; style?: string; glow?: boolean } | null;
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
  onCursorMove,
  pinConfig,
  pinEmoji,
  fieldGreen,
  trailConfig,
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
    () => {
      const el = document.documentElement.classList;
      if (el.contains('light')) return 'light' as const;
      if (el.contains('neon')) return 'neon' as const;
      return 'dark' as const;
    },
  );
  const isLightMode = () => theme === 'light';
  const isNeonMode = () => theme === 'neon';

  // ── NEON: Continent palette derived from logo (gold/orange/teal) ──
  // Each continent uses tones from the logo's color story
  const CONTINENT_COLORS_NEON: Record<string, string[]> = {
    Europe:   ['#C87828', '#E09038', '#B06820', '#D88530'], // warm amber (pin gold)
    Asia:     ['#D45020', '#E86830', '#C04018', '#F07838'], // hot orange (speed streaks)
    Africa:   ['#D4A030', '#E8B840', '#C09028', '#F0C048'], // bright gold
    Americas: ['#1A8870', '#209878', '#168068', '#28A888'], // teal (logo accent)
    Oceania:  ['#20786C', '#288880', '#187060', '#309888'], // deep teal
  };
  const FALLBACK_NEON = ['#3A4858', '#4A5868', '#2A3848', '#506070'];

  // Flat palette still needed for non-neon code paths
  const MAP_PALETTE_NEON = Object.values(CONTINENT_COLORS_NEON).flat();

  // Dark mode: warm earth tones — watercolor atlas feel
  const MAP_PALETTE_DARK = [
    '#D4A060', '#C07848', '#B84030', '#E8C070', '#C86040',
    '#A89060', '#A03028', '#DEB870', '#C86048', '#D4B070',
    '#B86838', '#E0B868', '#C07840', '#983820', '#D89860',
    '#B05038', '#E0A850', '#C88058', '#905030', '#D8B068',
  ];

  // Light mode: soft pastel political map
  const MAP_PALETTE_LIGHT = [
    '#C8DFA0', '#F2C882', '#EBB8C4', '#C8D8F0', '#F2E080',
    '#B8D8C8', '#EAC89A', '#D2C0E8', '#A8D8C4', '#F0D4A0',
    '#D4E8A8', '#F2B8A4', '#BCE4E8', '#E8D4B8', '#C4D898',
    '#F4C4CC', '#D0E0A4', '#DEC0D8', '#B8D4A4', '#F0DCAC',
  ];

  // Helper: convert geo coords to pixel coords for drawBaseMap (uses closure over scale/offset)
  const geoToPixel = useCallback((lon: number, lat: number) => ({
    x: offsetX + (lon - bounds.lonMin) * scale,
    y: offsetY + (bounds.latMax - lat) * scale,
  }), [offsetX, offsetY, bounds.lonMin, bounds.latMax, scale]);

  const drawBaseMap = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const light = isLightMode();
    const neon = isNeonMode();
    const MAP_PALETTE = neon ? MAP_PALETTE_NEON : light ? MAP_PALETTE_LIGHT : MAP_PALETTE_DARK;

    // Ocean fills the ENTIRE canvas (no letterbox gaps)
    if (fieldGreen) {
      // Modo Mundial: fondo verde grama (estadio)
      const grass = ctx.createLinearGradient(0, 0, 0, h);
      grass.addColorStop(0, '#1c4a30');
      grass.addColorStop(0.5, '#163a26');
      grass.addColorStop(1, '#102c1c');
      ctx.fillStyle = grass;
    } else if (light) {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#C8E8F4');
      oceanGrad.addColorStop(0.4, '#B0D8EC');
      oceanGrad.addColorStop(0.8, '#98C8E4');
      oceanGrad.addColorStop(1, '#84B8DC');
      ctx.fillStyle = oceanGrad;
    } else if (neon) {
      // Neon-Velocity: deep blue-black ocean — maximizes contrast
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0A0E18');
      oceanGrad.addColorStop(0.5, '#0C1020');
      oceanGrad.addColorStop(1, '#080C16');
      ctx.fillStyle = oceanGrad;
    } else {
      // Dark: cream/bone ocean — matches warm earth-tone watercolor palette
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
      if (neon) {
        const cont = getCountryContinent(country.name);
        const colors = cont ? CONTINENT_COLORS_NEON[cont] : FALLBACK_NEON;
        ctx.fillStyle = colors[ci % colors.length];
      } else {
        ctx.fillStyle = MAP_PALETTE[ci % MAP_PALETTE.length];
      }
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
    ctx.strokeStyle = neon ? 'rgba(255,255,255,0.45)' : light ? '#8899AA' : '#2A1408';
    ctx.lineWidth = neon ? 0.8 : 1.2;
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
            // Brighter highlight — more noticeable hint to lower difficulty
            ctx.fillStyle = neon ? 'rgba(0,212,170,0.34)' : light ? 'rgba(0,150,255,0.28)' : 'rgba(245,200,66,0.34)';
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
            // Dim non-continent countries more strongly to make the highlighted continent pop
            ctx.fillStyle = neon ? 'rgba(0,0,0,0.55)' : light ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)';
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
    ctx.strokeStyle = neon ? 'rgba(0,212,170,0.08)' : light ? 'rgba(60,90,110,0.18)' : 'rgba(100,70,30,0.20)';
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
      ctx.fillStyle = neon ? 'rgba(200,210,220,0.22)' : light ? '#1a3a4a' : 'rgba(80,50,20,0.60)';
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

    // Balón de fútbol decorativo (contorno) en el Pacífico — solo modo Mundial
    if (fieldGreen) {
      const c0 = geoToPixel(-150, -8);
      const R = Math.max(26, Math.min(w, h) * 0.085);
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(1.5, R * 0.05);
      // esfera
      ctx.beginPath();
      ctx.arc(c0.x, c0.y, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.stroke();
      // pentágono central
      const pr = R * 0.36;
      const penta: { x: number; y: number }[] = [];
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
        penta.push({ x: c0.x + Math.cos(ang) * pr, y: c0.y + Math.sin(ang) * pr });
      }
      ctx.beginPath();
      penta.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(16,38,24,0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.stroke();
      // costuras del pentágono hacia el borde
      penta.forEach((pt) => {
        const ang = Math.atan2(pt.y - c0.y, pt.x - c0.x);
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(c0.x + Math.cos(ang) * R, c0.y + Math.sin(ang) * R);
        ctx.stroke();
      });
      ctx.restore();
    }
  }, [gameMode, bounds, lonRange, latRange, theme, scale, offsetX, offsetY, geoToPixel, highlightContinent, fieldGreen]);

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

  // Build offscreen cache at high DPI with anti-aliasing
  useEffect(() => {
    const dpr = dprRef.current;
    const offscreen = document.createElement('canvas');
    offscreen.width = dimensions.w * dpr;
    offscreen.height = dimensions.h * dpr;
    const ctx = offscreen.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Enable anti-aliasing for smoother country borders
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawBaseMap(ctx, dimensions.w, dimensions.h);
    }
    offscreenRef.current = offscreen;
  }, [dimensions, drawBaseMap]);

  // Animated line progress
  const lineProgressRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // Render with animated line
  useEffect(() => {
    const neon = isNeonMode();
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
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
      // Bold orange-red trail, highly visible against any map theme
      // Equipped trail cosmetic overrides the default distance-based color.
    const equippedTrail = trailConfig?.color;
    const trailColor = equippedTrail ?? ((distanceKm ?? 0) > 1000 ? '239,68,68' : '234,120,30'); // red if far, deep orange if close
      const steps = Math.max(Math.floor(eased * 80), 2);
      for (let i = 0; i < steps - 1; i++) {
        const t0 = (i / steps) * eased;
        const t1 = ((i + 1) / steps) * eased;
        const p0 = bezierPt(t0);
        const p1 = bezierPt(t1);
        const alpha = 0.5 + 0.5 * (i / steps); // starts at 0.5, ends at 1.0
        ctx.strokeStyle = `rgba(${trailColor},${alpha})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      // White outline under the trail for contrast on dark maps
      if (progress >= 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.quadraticCurveTo(cpx, cpy, cx, cy);
        ctx.stroke();
        // Re-draw trail on top of white outline
        for (let i = 0; i < 80; i++) {
          const t0 = i / 80;
          const t1 = (i + 1) / 80;
          const p0 = bezierPt(t0);
          const p1 = bezierPt(t1);
          ctx.strokeStyle = `rgba(${trailColor},${0.6 + 0.4 * (i / 80)})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }

      // ── Thin dashed guide from tip to destination (preview) ──
      if (progress < 1) {
        const tip = bezierPt(eased);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = `rgba(${trailColor},0.35)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.quadraticCurveTo(cpx, cpy, cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── User pin (always visible, pulsing ring) — uses equipped cosmetic if any ──
      const pulse = 1 + 0.15 * Math.sin(elapsed * 0.004);
      const pinFill = pinConfig?.fill ?? (neon ? '#00D4AA' : '#4fc3f7');
      const pinGlow = pinConfig?.glow ?? (neon ? 'rgba(0,212,170,0.35)' : 'rgba(79,195,247,0.3)');
      const pinSize = pinConfig?.size ?? 8;
      ctx.fillStyle = pinFill;
      ctx.strokeStyle = pinGlow;
      ctx.lineWidth = 3 * pulse;
      ctx.beginPath();
      ctx.arc(ux, uy, pinSize * pulse, 0, Math.PI * 2);
      ctx.stroke();
      if (pinEmoji) {
        // Pin temático (ej. balón ⚽): dibuja el emoji centrado en el punto tocado.
        ctx.font = `${Math.round((pinSize + 6) * pulse)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pinEmoji, ux, uy);
      } else {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ux, uy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Show correct pin and distance label only when line is complete
      if (progress >= 1) {
        // Correct pin — large vivid beacon impossible to miss
        const isClose = (distanceKm ?? 9999) < 500;
        const beaconColor = isClose ? '#22c55e' : '#ef4444';
        const beaconGlow = isClose ? 'rgba(34,197,94,' : 'rgba(239,68,68,';
        const t = Date.now() * 0.004;
        const pulse = 1 + 0.25 * Math.sin(t);

        // Expanding ripple rings (2 offset ripples)
        for (let r = 0; r < 2; r++) {
          const rippleT = ((t * 0.8 + r * 3.14) % 6.28) / 6.28;
          const rippleR = 16 + rippleT * 40;
          const rippleAlpha = 0.5 * (1 - rippleT);
          ctx.beginPath();
          ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `${beaconGlow}${rippleAlpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Large outer glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35 * pulse);
        grad.addColorStop(0, `${beaconGlow}0.5)`);
        grad.addColorStop(0.5, `${beaconGlow}0.15)`);
        grad.addColorStop(1, `${beaconGlow}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 35 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core circle — big and bold
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fillStyle = beaconColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crosshair lines — thick and long
        ctx.strokeStyle = `${beaconGlow}0.8)`;
        ctx.lineWidth = 2;
        const crossLen = 30;
        ctx.beginPath();
        ctx.moveTo(cx - crossLen, cy); ctx.lineTo(cx - 16, cy);
        ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + crossLen, cy);
        ctx.moveTo(cx, cy - crossLen); ctx.lineTo(cx, cy - 16);
        ctx.moveTo(cx, cy + 16); ctx.lineTo(cx, cy + crossLen);
        ctx.stroke();

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
        // Keep animating for 3s after line completes (beacon pulse)
        if (elapsed < lineDuration + 3000) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      } else {
        // ── Glowing dot at line tip — large orange-red ──
        const tip = bezierPt(eased);
        const dotColor = (distanceKm ?? 0) > 1000 ? '239,68,68' : '234,120,30';
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 18);
        glow.addColorStop(0, `rgba(${dotColor},0.95)`);
        glow.addColorStop(0.4, `rgba(${dotColor},0.4)`);
        glow.addColorStop(1, `rgba(${dotColor},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 18, 0, Math.PI * 2);
        ctx.fill();
        // solid core
        ctx.fillStyle = `rgb(${dotColor})`;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, userClick, correctLocation, distanceKm, lonToX, latToY, theme, pinConfig, pinEmoji, trailConfig]);

  // Training mode: pulsing hint zone animation (runs only when hintZone is set and user hasn't clicked)
  const hintAnimFrameRef = useRef<number>(0);
  useEffect(() => {
    const neon = isNeonMode();
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

      // 1. Backdrop circle — prevents country colors from bleeding through
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = neon ? 'rgba(0, 210, 87, 0.08)' : 'rgba(255, 255, 255, 0.28)';
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
    // Use CONTAINER rect (not canvas) — canvas has CSS transform that skews getBoundingClientRect
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Inverse of CSS scale transform: logicalPos = (visualPos - origin) / zoom + origin
    const originX = rect.width * pinchOrigin.x / 100;
    const originY = rect.height * pinchOrigin.y / 100;
    const adjustedX = (x - originX) / pinchZoom + originX;
    const adjustedY = (y - originY) / pinchZoom + originY;
    onMapClick(yToLat(adjustedY), xToLon(adjustedX), e.clientX, e.clientY);
  }, [clickDisabled, onMapClick, xToLon, yToLat, pinchZoom, pinchOrigin]);

  // ── Cursor coordinate tracking ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCursorMove) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const originX = rect.width * pinchOrigin.x / 100;
    const originY = rect.height * pinchOrigin.y / 100;
    const adjustedX = (x - originX) / pinchZoom + originX;
    const adjustedY = (y - originY) / pinchZoom + originY;
    onCursorMove(yToLat(adjustedY), xToLon(adjustedX));
  }, [onCursorMove, xToLon, yToLat, pinchZoom, pinchOrigin]);

  // ── ZOOM BOMB — Smooth cinematic camera flight to result ──
  // Phase 1: Gentle zoom to user click (0-600ms)
  // Phase 2: Smooth pan to midpoint (600-1600ms)
  // Phase 3: Hold with breathing (1600-3000ms)
  // Phase 4: Graceful pull-back to overview (3000-4800ms)
  const zoomBombRafRef = useRef<number>(0);
  const zoomBombActiveRef = useRef<boolean>(false);
  useEffect(() => {
    if (!userClick || !correctLocation || !containerRef.current) {
      return;
    }

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Cancel any previous zoom bomb
    if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);

    const vw = window.innerWidth;
    const uxPct = (lonToX(userClick.lon) / dimensions.w) * 100;
    const uyPct = (latToY(userClick.lat) / dimensions.h) * 100;
    const midLon = (userClick.lon + correctLocation.lon) / 2;
    const midLat = (userClick.lat + correctLocation.lat) / 2;
    const mxPct = (lonToX(midLon) / dimensions.w) * 100;
    const myPct = (latToY(midLat) / dimensions.h) * 100;

    // Adaptive peak zoom — subtle and cinematic, not jarring
    const pointSpreadX = Math.abs(userClick.lon - correctLocation.lon) / lonRange;
    const pointSpreadY = Math.abs(userClick.lat - correctLocation.lat) / latRange;
    const pointSpread = Math.max(pointSpreadX, pointSpreadY);

    let peakZoom: number;
    if (vw < 640) peakZoom = 1.8;        // mobile: deep immersive zoom
    else if (vw < 1025) peakZoom = 2.0;  // tablet: strong
    else peakZoom = 2.2;                  // desktop: cinematic

    // Reduce zoom if points are very far apart so both stay in frame
    const spreadPenalty = pointSpread > 0.3 ? Math.max(0.5, 1 - (pointSpread - 0.3) * 0.7) : 1;
    peakZoom = Math.max(1.4, peakZoom * spreadPenalty);

    // Punch zoom — slight overshoot for dramatic impact
    const punchZoom = Math.min(peakZoom * 1.06, peakZoom + 0.15);

    // Timing (ms) — extended ~6.5s total (+1.5s vs before)
    const T_PUNCH = 1000;      // zoom-in to user click
    const T_PAN = 1500;        // smooth pan to midpoint
    const T_HOLD = 1200;       // hold with breathing
    const T_PULL = 2800;       // slow cinematic pull-back
    const T_TOTAL = T_PUNCH + T_PAN + T_HOLD + T_PULL;

    // Easing helpers — all smooth curves, no sharp expo
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    let startTime: number | null = null;

    const animateZoom = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      let currentZoom: number;
      let originX: number;
      let originY: number;

      if (elapsed < T_PUNCH) {
        // Phase 1: Gentle zoom toward user click
        const t = easeOutCubic(elapsed / T_PUNCH);
        currentZoom = lerp(1, punchZoom, t);
        originX = uxPct;
        originY = uyPct;
      } else if (elapsed < T_PUNCH + T_PAN) {
        // Phase 2: Smooth pan to midpoint + settle to peak zoom
        const t = easeInOutQuad((elapsed - T_PUNCH) / T_PAN);
        currentZoom = lerp(punchZoom, peakZoom, t);
        originX = lerp(uxPct, mxPct, t);
        originY = lerp(uyPct, myPct, t);
      } else if (elapsed < T_PUNCH + T_PAN + T_HOLD) {
        // Phase 3: Hold with gentle breathing
        const holdT = (elapsed - T_PUNCH - T_PAN) / T_HOLD;
        const breath = Math.sin(holdT * Math.PI) * 0.02;
        currentZoom = peakZoom + breath;
        originX = mxPct;
        originY = myPct;
      } else if (elapsed < T_TOTAL) {
        // Phase 4: Slow graceful pull-back to overview
        const t = easeOutCubic((elapsed - T_PUNCH - T_PAN - T_HOLD) / T_PULL);
        currentZoom = lerp(peakZoom, 1, t);
        originX = lerp(mxPct, 50, t);
        originY = lerp(myPct, 50, t);
      } else {
        // Done — reset via DOM, then sync React state
        zoomBombActiveRef.current = false;
        const el = canvasRef.current;
        if (el) {
          el.style.transform = 'scale(1)';
          el.style.transformOrigin = '50% 50%';
          el.style.transition = 'none';
        }
        setZoomStyle({});
        return;
      }

      // Direct DOM manipulation — bypasses React state to avoid batching drops
      const el = canvasRef.current;
      if (el) {
        el.style.transform = `scale(${currentZoom.toFixed(4)})`;
        el.style.transformOrigin = `${originX.toFixed(2)}% ${originY.toFixed(2)}%`;
        el.style.transition = 'none';
      }

      zoomBombRafRef.current = requestAnimationFrame(animateZoom);
    };

    // Mark zoom bomb as active so React inline styles don't overwrite DOM
    zoomBombActiveRef.current = true;

    // Small delay so the click registers visually first
    const kickoff = setTimeout(() => {
      zoomBombRafRef.current = requestAnimationFrame(animateZoom);
    }, 100);

    return () => {
      clearTimeout(kickoff);
      if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);
    };
  }, [userClick, correctLocation, bounds, lonRange, latRange, lonToX, latToY, dimensions]);

  // Reset zoom when markers clear
  useEffect(() => {
    if (!userClick && !correctLocation) {
      if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);
      zoomBombActiveRef.current = false;
      // Smooth pullback via DOM
      const el = canvasRef.current;
      if (el) {
        el.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'scale(1)';
        el.style.transformOrigin = '50% 50%';
      }
      setZoomStyle({});
    }
  }, [userClick, correctLocation]);
  // Ocean background colors — must match exactly what drawBaseMap paints as ocean.
  // This makes letterbox areas (when geo ratio ≠ container ratio) visually seamless:
  // the "empty" space around the canvas looks like ocean instead of a black bar.
  // ── Custom crosshair cursor (Phase 4) ──
  const crosshairCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='none' stroke='%23f5c842' stroke-width='1.5' opacity='0.7'/%3E%3Ccircle cx='16' cy='16' r='2' fill='%23f5c842' opacity='0.9'/%3E%3Cline x1='16' y1='0' x2='16' y2='10' stroke='%23f5c842' stroke-width='1' opacity='0.5'/%3E%3Cline x1='16' y1='22' x2='16' y2='32' stroke='%23f5c842' stroke-width='1' opacity='0.5'/%3E%3Cline x1='0' y1='16' x2='10' y2='16' stroke='%23f5c842' stroke-width='1' opacity='0.5'/%3E%3Cline x1='22' y1='16' x2='32' y2='16' stroke='%23f5c842' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E") 16 16, crosshair`;

  const oceanBg = fieldGreen
    ? 'linear-gradient(180deg, #1c4a30 0%, #163a26 50%, #102c1c 100%)'
    : theme === 'light'
    ? 'linear-gradient(180deg, #C8E8F4 0%, #98C8E4 50%, #84B8DC 100%)'
    : theme === 'neon'
      ? 'linear-gradient(180deg, #0A0E18 0%, #0C1020 50%, #080C16 100%)'
      : 'linear-gradient(180deg, #EDE0C8 0%, #E8D8BC 50%, #E0CEB0 100%)';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '50dvh',  background: oceanBg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas fills entire container — ocean + grid extend to all edges */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        role="img"
        aria-label="Mapa mundial interactivo. Haz clic para colocar tu respuesta."
        tabIndex={0}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: clickDisabled ? 'default' : crosshairCursor,
          // Combine auto-zoom (result) and pinch zoom (user)
          // When zoomBombActiveRef is true, rAF drives the canvas directly via DOM —
          // do NOT set transform/origin here or React will overwrite rAF values.
          ...(pinchZoom > 1
            ? {
                transform: `scale(${pinchZoom})`,
                transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`,
                transition: 'transform 0.1s ease-out',
              }
            : zoomBombActiveRef.current
              ? {} // rAF owns transform — React must not touch it
              : {
                  transform: zoomStyle.transform || 'scale(1)',
                  transformOrigin: (zoomStyle.transformOrigin as string) || '50% 50%',
                  transition: (zoomStyle.transition as string) || 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
                }),
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

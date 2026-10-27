import { prefersReducedMotion } from '@/lib/prefs';
import { CONTINENT_COUNTRIES, getColorGroup } from '@/lib/mapContinents';
import { BRAND_RGB, BRAND, rgba, MAP_CONTINENT_COLORS } from '@/lib/theme';
import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import { countries } from '@/data/countries';
import { type GameMode, type MapBounds, getMapBounds, isPackMode } from '@/data/cities';
import { usePackShapes } from '@/hooks/useFeatureShapes';
import type { FeatureShapes } from '@/lib/featureScoring';
import { unlockAudio } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import { appNumberLocale } from '@/lib/format';
import { getHiResMap, loadHiResMap, traceCountry, traceArcs, countryAt, labelSpots, boxesIntersect, type HiResMap } from '@/lib/hiResMap';
import { layoutPills, layoutTexts, rectAround, nearestOnRect, type PillRequest, type PlacedPill, type Rect, type Pt } from '@/lib/mapLabels';
import { planAnswerZoom, clampZoomFrame } from '@/lib/mapZoom';
import { IDENTITY_VIEW, DRAG_SLOP_TOUCH, DRAG_SLOP_MOUSE, zoomAround, pinchView, panView, toLogical, isIdentityView, viewTransform, type MapView } from '@/lib/mapView';
import { countryDisplayName, countryIso } from '@/lib/flags';
import { PRO_PACK_META } from '@/data/proPackMeta';

/** Índice de cada país en countries.ts: el mapa detallado usa el mismo color que la vista del mundo */
const LOW_INDEX = new Map(countries.map((c, i) => [c.name, i]));
/** Prefijo de los departamentos de cada pack en packShapes.json y el país del pack (nombre de countries.ts / 1:50m) */
/** Países de cada pack (ISO): sus divisiones se dibujan (`div:<iso>-…`) y el resto de países queda atenuado */
const packIsos = (mode: GameMode): string[] | null =>
  mode === 'colombia' ? ['CO'] : mode in PRO_PACK_META ? PRO_PACK_META[mode as keyof typeof PRO_PACK_META].isos : null;
const PACK_INFO: Partial<Record<GameMode, { prefixes: string[]; isos: Set<string> }>> = Object.fromEntries(
  (['colombia', 'andes', 'conosur', 'mexcam', 'caribe'] as GameMode[]).map((m) => {
    const isos = packIsos(m) ?? [];
    return [m, { prefixes: isos.map((i) => `div:${i.toLowerCase()}-`), isos: new Set(isos) }];
  }),
);

/**
 * Pack de país (Fase 7) sobre el mapa: cada departamento con uno de cuatro tonos (los vecinos nunca comparten tono) y las
 * fronteras internas finas, cada una dibujada una sola vez (vienen de los lados compartidos, scripts/build-colombia.mjs).
 * Sin nombres de departamentos: delatarían la respuesta.
 */
function drawPackOverlay(ctx: CanvasRenderingContext2D, shapes: FeatureShapes, mode: GameMode, toXY: (lon: number, lat: number) => { x: number; y: number }) {
  const info = PACK_INFO[mode];
  if (!info) return;
  const TONES = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0.26)', rgba(BRAND_RGB.navyDeep, 0.14)];
  ctx.save();
  for (const [id, sh] of Object.entries(shapes)) {
    if (!info.prefixes.some((p) => id.startsWith(p))) continue;
    ctx.fillStyle = TONES[(sh.tone ?? 0) % TONES.length];
    for (const ring of sh.rings) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) { const { x, y } = toXY(ring[i][0], ring[i][1]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.closePath();
      ctx.fill();
    }
  }
  const borders = shapes[`borders:${mode}`];
  if (borders) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const line of borders.rings) {
      ctx.beginPath();
      for (let i = 0; i < line.length; i++) { const { x, y } = toXY(line[i][0], line[i][1]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Contorno de un lugar geográfico (Fase 6b) sobre el mapa: área rellena con borde, o trazo grueso con halo (ríos) */
function drawShape(ctx: CanvasRenderingContext2D, shape: { line: boolean; rings: number[][][] }, toXY: (lon: number, lat: number) => { x: number; y: number }) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const trace = (ring: number[][]) => {
    ctx.beginPath();
    for (let i = 0; i < ring.length; i++) {
      const { x, y } = toXY(ring[i][0], ring[i][1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  };
  if (shape.line) {
    for (const pass of [{ w: 7, c: 'rgba(255,255,255,0.55)' }, { w: 3.5, c: rgba(BRAND_RGB.turquoise, 0.95) }]) {
      ctx.lineWidth = pass.w;
      ctx.strokeStyle = pass.c;
      for (const ring of shape.rings) { trace(ring); ctx.stroke(); }
    }
  } else {
    ctx.fillStyle = rgba(BRAND_RGB.turquoise, 0.38);
    ctx.strokeStyle = rgba(BRAND_RGB.turquoise, 0.95);
    ctx.lineWidth = 2.5;
    for (const ring of shape.rings) { trace(ring); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}

const PILL_FONT_SM = '700 11px Poppins, system-ui, sans-serif';
const PILL_FONT = '700 12px Poppins, system-ui, sans-serif';
const PILL_FONT_LG = '700 13px Poppins, system-ui, sans-serif';
const DIST_FONT_SM = '700 12px Poppins, system-ui, sans-serif';
const DIST_FONT = '700 13px Poppins, system-ui, sans-serif';
const DIST_FONT_LG = '700 14px Poppins, system-ui, sans-serif';
/** Vista acercada (lo visible abarca ≤ 160° de longitud): contornos detallados y nombres de países */
const ZOOMED_LON_SPAN = 160;

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
  /** Decoración del Pacífico en modo Mundial: balón o copa (aleatorio al entrar). */
  pacificDecor?: 'ball' | 'trophy';
  /** Equipped trail cosmetic config (color as 'r,g,b' or colors[] for rainbow) */
  trailConfig?: { color?: string; colors?: string[]; width?: number; style?: string; glow?: boolean } | null;
  /** Etiquetas junto a los pines tras responder ("Tu respuesta" / "Ciudad correcta") */
  pinLabels?: { you: string; correct: string } | null;
  /** Respuesta del rival en la revisión del reto: pin turquesa + línea punteada a la ciudad. Pasar memoizado. */
  rivalClick?: { lat: number; lon: number; label: string; distanceKm?: number | null } | null;
  /** Botones −/+/centrar (maqueta Partida_APROBADA_v1). Por defecto visibles. */
  showZoomControls?: boolean;
  /** Encuadre geográfico fijo (Revisión de ciudad). Sustituye los límites del modo y redibuja nítido. Pasar memoizado. */
  viewBounds?: MapBounds | null;
  /**
   * Partes del mapa tapadas por la interfaz, que las etiquetas evitan: fracciones del mapa cubiertas por
   * la tarjeta de respuesta (`right`/`top`/`bottom`, las mismas que frameAnswer) y una esquina inferior
   * izquierda en px (leyenda de pines). Pasar memoizado.
   */
  labelAvoid?: { right?: number; top?: number; bottom?: number; corner?: { w: number; h: number } } | null;
  /** Juice del combo (puntaje v2): onda expansiva en tu pin al acertar y chispas desde ×1,2. Pasar memoizado. */
  pinFx?: { level: number } | null;
  /** Banderas (Fase 6): país a resaltar tras responder (nombre de countries.ts), en turquesa */
  highlightCountry?: string | null;
  /** Lugares (Fase 6b): contorno a resaltar tras responder (featureShapes.json): área rellena o trazo (río). Pasar memoizado. */
  highlightShape?: { line: boolean; rings: number[][][] } | null;
  /** Editor de quizzes (Fase 10): puntos de los lugares disponibles (on = elegido). Pasar memoizado. */
  markers?: { lat: number; lon: number; on: boolean }[] | null;
}

/** Nombres del mapa base en inglés (AUD05: en inglés salían en español). La clave es el texto en español, con sus
 *  saltos de línea. */
const MAP_LABELS_EN: Record<string, string> = {
  'AMÉRICA\nDEL NORTE': 'NORTH\nAMERICA', 'AMÉRICA\nDEL SUR': 'SOUTH\nAMERICA', 'AMÉRICA\nCENTRAL': 'CENTRAL\nAMERICA',
  'EUROPA': 'EUROPE', 'ÁFRICA': 'AFRICA', 'ASIA': 'ASIA',
  'OCEANÍA': 'OCEANIA', 'ANTÁRTIDA': 'ANTARCTICA', 'OCÉANO PACÍFICO': 'PACIFIC OCEAN',
  'OCÉANO ATLÁNTICO': 'ATLANTIC OCEAN', 'OCÉANO ÍNDICO': 'INDIAN OCEAN', 'OCÉANO ÁRTICO': 'ARCTIC OCEAN',
  'OCÉANO AUSTRAL': 'SOUTHERN OCEAN', 'OCÉANO\nATLÁNTICO': 'ATLANTIC\nOCEAN', 'OCÉANO\nPACÍFICO': 'PACIFIC\nOCEAN',
  'OCÉANO\nÍNDICO': 'INDIAN\nOCEAN', 'MAR\nMEDITERRÁNEO': 'MEDITERRANEAN\nSEA', 'MAR DEL\nNORTE': 'NORTH\nSEA',
  'MAR\nBÁLTICO': 'BALTIC\nSEA', 'MAR\nNEGRO': 'BLACK\nSEA', 'MAR\nARÁBIGO': 'ARABIAN\nSEA',
  'MAR DE\nCHINA': 'SOUTH CHINA\nSEA', 'MAR DE\nJAPÓN': 'SEA OF\nJAPAN', 'GOLFO\nPÉRSICO': 'PERSIAN\nGULF',
  'ÁFRICA\nDEL NORTE': 'NORTH\nAFRICA', 'ÁFRICA\nOCCIDENTAL': 'WEST\nAFRICA', 'ÁFRICA\nORIENTAL': 'EAST\nAFRICA',
  'ÁFRICA\nCENTRAL': 'CENTRAL\nAFRICA', 'ÁFRICA\nAUSTRAL': 'SOUTHERN\nAFRICA', 'MAR\nROJO': 'RED\nSEA',
  'MAR CARIBE': 'CARIBBEAN SEA', 'MAR\nCARIBE': 'CARIBBEAN\nSEA', 'PERÚ': 'PERU',
  'BRASIL': 'BRAZIL', 'PANAMÁ': 'PANAMA',
};
const mapLabel = (name: string, locale: string) => (locale === 'en' ? MAP_LABELS_EN[name] ?? name : name);

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
  pacificDecor,
  trailConfig,
  pinLabels,
  rivalClick,
  showZoomControls = true,
  viewBounds,
  labelAvoid,
  pinFx,
  highlightCountry,
  highlightShape,
  markers,
}: WorldMapCanvasProps) {
  const { t, locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Raw container size tracked by ResizeObserver
  const [containerSize, setContainerSize] = useState({ w: 800, h: 450 });
  const dprRef = useRef(Math.min(window.devicePixelRatio || 1, 3));

  // Decoración PNG del Mundial (Pacífico sur): balón o copa según pacificDecor
  const decorImgRef = useRef<HTMLImageElement | null>(null);
  const [decorReady, setDecorReady] = useState(false);
  useEffect(() => {
    if (!fieldGreen) return;
    const src = pacificDecor === 'trophy' ? '/mundial-cup.png' : '/mundial-ball.png';
    setDecorReady(false);
    const img = new Image();
    img.onload = () => { decorImgRef.current = img; setDecorReady(true); };
    img.src = src;
  }, [fieldGreen, pacificDecor]);

  // ── Zoom y paneo manuales (src/lib/mapView.ts) ──
  // La vista vive en un ref y se escribe directo en el estilo del lienzo (como el zoom de la respuesta), para
  // seguir los dedos sin re-renderizar en cada movimiento. React solo guarda el nivel para el indicador.
  const viewRef = useRef<MapView>(IDENTITY_VIEW);
  const [zoomLabel, setZoomLabel] = useState(1);
  const [grabbing, setGrabbing] = useState(false);
  const [dragLearned, setDragLearned] = useState(() => { try { return localStorage.getItem('geospeed_map_drag_learned') === '1'; } catch { return false; } });
  type Gesture =
    | { kind: 'one'; sx: number; sy: number; start: MapView; dragging: boolean }
    | { kind: 'pinch'; dist: number; mid: { x: number; y: number }; start: MapView };
  const gestureRef = useRef<Gesture | null>(null);
  /** Hasta cuándo ignorar el clic que el navegador envía al soltar un arrastre o un pellizco */
  const suppressClickUntil = useRef(0);
  const mouseDragCleanupRef = useRef<(() => void) | null>(null);
  // Zoom de la respuesta (más abajo): mientras vuela, los gestos manuales no tocan el lienzo
  const zoomBombRafRef = useRef<number>(0);
  const zoomBombActiveRef = useRef<boolean>(false);

  const bounds = viewBounds ?? getMapBounds(gameMode);
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

  // ── Mapa detallado (1:50m) para las vistas acercadas: se descarga una vez, poco después de abrir el mapa
  // (o de inmediato si ya está acercado), para que esté listo cuando llegue la primera respuesta.
  const zoomedView = dimensions.w / scale <= ZOOMED_LON_SPAN;
  const [hiRes, setHiRes] = useState<HiResMap | null>(getHiResMap);
  useEffect(() => {
    if (hiRes) return;
    let alive = true;
    const id = setTimeout(() => { loadHiResMap().then((m) => { if (alive) setHiRes(m); }).catch(() => {}); }, zoomedView ? 0 : 1500);
    return () => { alive = false; clearTimeout(id); };
  }, [hiRes, zoomedView]);
  const detailMap = zoomedView ? hiRes : null;
  // Pack de país (Fase 7): departamentos y fronteras internas, que se descargan aparte
  const packOn = isPackMode(gameMode);
  const packShapes = usePackShapes(packOn ? gameMode : null);
  const packInfo = packOn ? PACK_INFO[gameMode] : undefined;
  // Lo visible del lienzo en grados (con margen), para no recorrer lo que queda fuera
  const visibleBox = useCallback((w: number, h: number): [number, number, number, number] => [
    bounds.lonMin - offsetX / scale - 1,
    bounds.latMax - (h - offsetY) / scale - 1,
    bounds.lonMin + (w - offsetX) / scale + 1,
    bounds.latMax + offsetY / scale + 1,
  ], [bounds.lonMin, bounds.latMax, offsetX, offsetY, scale]);

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
  // Rediseño v2: un color por continente, variaciones suaves por país, hielo gris-azulado.
  const CONTINENT_COLORS_NEON = MAP_CONTINENT_COLORS;
  const FALLBACK_NEON = CONTINENT_COLORS_NEON.Ice;

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
      oceanGrad.addColorStop(0, BRAND.navyDeep);
      oceanGrad.addColorStop(0.5, BRAND.navy);
      oceanGrad.addColorStop(1, BRAND.navyDeep);
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

    if (detailMap) {
      // ── Vista acercada: contornos 1:50m. Primero los rellenos; luego costas y fronteras, cada arco una
      // sola vez (sin líneas dobles) con uniones redondeadas.
      const vis = visibleBox(w, h);
      const X = (lon: number) => offsetX + (lon - bounds.lonMin) * scale;
      const Y = (lat: number) => offsetY + (bounds.latMax - lat) * scale;
      for (const c of detailMap.countries) {
        if (!boxesIntersect(c.bbox, vis)) continue;
        const k = LOW_INDEX.get(c.name) ?? (LOW_INDEX.get(c.ref) ?? 0) + 1;
        if (neon) {
          const colors = CONTINENT_COLORS_NEON[getColorGroup(c.ref)] ?? FALLBACK_NEON;
          ctx.fillStyle = colors[k % colors.length];
        } else {
          ctx.fillStyle = MAP_PALETTE[k % MAP_PALETTE.length];
        }
        ctx.beginPath();
        if (traceCountry(ctx, c, X, Y, vis)) ctx.fill('evenodd');
        // En un pack, los países vecinos quedan atenuados para que resalte el país del pack
        if (packInfo && !packInfo.isos.has(countryIso(c.name) ?? countryIso(c.ref) ?? '')) {
          ctx.fillStyle = rgba(BRAND_RGB.navyDeep, 0.42);
          ctx.beginPath();
          if (traceCountry(ctx, c, X, Y, vis)) ctx.fill('evenodd');
        }
      }
      if (packOn && packShapes) drawPackOverlay(ctx, packShapes, gameMode, (lon, lat) => ({ x: X(lon), y: Y(lat) }));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = neon ? 'rgba(255,255,255,0.5)' : light ? '#8899AA' : '#2A1408';
      ctx.lineWidth = 1;
      ctx.beginPath();
      traceArcs(ctx, detailMap, detailMap.coastArcs, X, Y, vis);
      ctx.stroke();
      ctx.strokeStyle = neon ? 'rgba(255,255,255,0.92)' : light ? '#8899AA' : '#2A1408';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      traceArcs(ctx, detailMap, detailMap.borderArcs, X, Y, vis);
      ctx.stroke();
      if (highlightCountry) {
        // País correcto de una bandera: relleno y borde turquesa (también sus islas y territorios con el mismo ref)
        for (const c of detailMap.countries) {
          if (c.name !== highlightCountry && c.ref !== highlightCountry) continue;
          if (!boxesIntersect(c.bbox, vis)) continue;
          ctx.fillStyle = rgba(BRAND_RGB.turquoise, 0.42);
          ctx.strokeStyle = rgba(BRAND_RGB.turquoise, 0.95);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          if (traceCountry(ctx, c, X, Y, vis)) { ctx.fill('evenodd'); ctx.stroke(); }
        }
      }
      if (highlightShape) drawShape(ctx, highlightShape, (lon, lat) => ({ x: X(lon), y: Y(lat) }));
      if (highlightContinent && CONTINENT_COUNTRIES[highlightContinent]) {
        const set = CONTINENT_COUNTRIES[highlightContinent];
        for (const c of detailMap.countries) {
          if (!boxesIntersect(c.bbox, vis)) continue;
          ctx.fillStyle = set.has(c.ref)
            ? (neon ? 'rgba(255,255,255,0.14)' : light ? 'rgba(0,150,255,0.28)' : rgba(BRAND_RGB.yellow, 0.34))
            : (neon ? rgba(BRAND_RGB.navyDeep, 0.38) : light ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)');
          ctx.beginPath();
          if (traceCountry(ctx, c, X, Y, vis)) ctx.fill('evenodd');
        }
      }
    } else {
    // ── Two-pass rendering to eliminate sub-pixel gaps at country borders ──
    // Pass 1: Fill all polygons.
    for (let ci = 0; ci < countries.length; ci++) {
      const country = countries[ci];
      if (neon) {
        const colors = CONTINENT_COLORS_NEON[getColorGroup(country.name)] ?? FALLBACK_NEON;
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
    if (packOn && packShapes) drawPackOverlay(ctx, packShapes, gameMode, (lon, lat) => geoToPixel(lon, lat));
    // Pass 2: Stroke all borders on top of the fills.
    ctx.strokeStyle = neon ? 'rgba(255,255,255,0.6)' : light ? '#8899AA' : '#2A1408';
    ctx.lineWidth = neon ? 0.9 : 1.2;
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

    // ── País correcto de una bandera (Fase 6): relleno y borde turquesa ──
    if (highlightCountry) {
      const hc = countries.find((c) => c.name === highlightCountry);
      if (hc) {
        ctx.fillStyle = rgba(BRAND_RGB.turquoise, 0.42);
        ctx.strokeStyle = rgba(BRAND_RGB.turquoise, 0.95);
        ctx.lineWidth = 2.5;
        for (const polygon of hc.polygons) {
          ctx.beginPath();
          for (let i = 0; i < polygon.length; i++) {
            const { x, y } = geoToPixel(polygon[i][0], polygon[i][1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
    // ── Lugar correcto (Fase 6b): área rellena o trazo del río en turquesa ──
    if (highlightShape) drawShape(ctx, highlightShape, (lon, lat) => geoToPixel(lon, lat));

    // ── Continent highlight overlay (#20) ──
    if (highlightContinent) {
      const continentCountries = CONTINENT_COUNTRIES[highlightContinent];
      if (continentCountries) {
        for (let ci = 0; ci < countries.length; ci++) {
          const country = countries[ci];
          const inContinent = continentCountries.has(country.name);
          if (inContinent) {
            // Brighter highlight — more noticeable hint to lower difficulty
            ctx.fillStyle = neon ? 'rgba(255,255,255,0.14)' : light ? 'rgba(0,150,255,0.28)' : rgba(BRAND_RGB.yellow, 0.34);
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
            ctx.fillStyle = neon ? rgba(BRAND_RGB.navyDeep, 0.38) : light ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)';
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
    }

    // Graticule — extends across the ENTIRE canvas, not just geographic bounds
    ctx.strokeStyle = neon ? rgba(BRAND_RGB.turquoise, 0.08) : light ? 'rgba(60,90,110,0.18)' : 'rgba(100,70,30,0.20)';
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
      // Continentes: navy oscuro sobre el color del continente. Océanos (itálica): azul claro sobre el mar.
      ctx.fillStyle = neon ? (italic ? 'rgba(170,205,240,0.75)' : rgba(BRAND_RGB.navyDeep, 0.78)) : light ? '#1a3a4a' : 'rgba(80,50,20,0.60)';
      if (neon && italic) ctx.letterSpacing = '0.12em';
      for (const l of labels) {
        const p = geoToPixel(l.lon, l.lat);
        const lines = mapLabel(l.name, locale).split('\n');
        // Dentro del lienzo: en los bordes ("OCÉANO AUSTRAL" sobre el límite sur, el Pacífico del lado
        // derecho) el texto salía cortado. Lo que queda del todo fuera de la vista no se dibuja.
        const blockW = Math.max(...lines.map((line) => ctx.measureText(line).width));
        const blockH = lines.length * (fontSize + 2);
        if (p.x + blockW / 2 < 0 || p.x - blockW / 2 > w || p.y + blockH / 2 < 0 || p.y - blockH / 2 > h) continue;
        const x = Math.min(Math.max(p.x, blockW / 2 + 6), w - blockW / 2 - 6);
        const y = Math.min(Math.max(p.y, blockH / 2 + 4), h - blockH / 2 - 4);
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * (fontSize + 2));
        });
      }
      if (neon) ctx.letterSpacing = '0px';
    };

    if (gameMode === 'world') {
      const fontSize = Math.max(10, Math.round(w / 78));
      // En la vista acercada de una respuesta no van los continentes: ahí se nombran los países
      if (!(viewBounds && zoomedView)) drawLabels([
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
        { name: 'OCÉANO AUSTRAL', lat: -62, lon: 20 },
      ], Math.max(9, Math.round(w / 110)), true);
    } else if (gameMode === 'europe') {
      drawLabels([
        { name: 'OCÉANO\nATLÁNTICO', lat: 50, lon: -18 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 36, lon: 15 },
        { name: 'MAR DEL\nNORTE', lat: 58, lon: 3 },
        { name: 'MAR\nBÁLTICO', lat: 58, lon: 20 },
        { name: 'MAR\nNEGRO', lat: 43, lon: 35 },
      ], Math.max(10, Math.round(w / 70)), true);
    } else if (gameMode === 'asia') {
      drawLabels([
        { name: 'OCÉANO\nÍNDICO', lat: -5, lon: 75 },
        { name: 'OCÉANO\nPACÍFICO', lat: 25, lon: 140 },
        { name: 'MAR\nARÁBIGO', lat: 15, lon: 62 },
        { name: 'MAR DE\nCHINA', lat: 15, lon: 115 },
        { name: 'MAR DE\nJAPÓN', lat: 40, lon: 135 },
        { name: 'GOLFO\nPÉRSICO', lat: 27, lon: 51 },
      ], Math.max(10, Math.round(w / 70)), true);
    } else if (gameMode === 'africa') {
      drawLabels([
        { name: 'ÁFRICA\nDEL NORTE', lat: 30, lon: 10 },
        { name: 'ÁFRICA\nOCCIDENTAL', lat: 10, lon: -8 },
        { name: 'ÁFRICA\nORIENTAL', lat: 0, lon: 38 },
        { name: 'ÁFRICA\nCENTRAL', lat: 0, lon: 18 },
        { name: 'ÁFRICA\nAUSTRAL', lat: -25, lon: 25 },
      ], Math.max(10, Math.round(w / 70)));
      drawLabels([
        { name: 'OCÉANO\nATLÁNTICO', lat: 5, lon: -20 },
        { name: 'OCÉANO\nÍNDICO', lat: -15, lon: 52 },
        { name: 'MAR\nMEDITERRÁNEO', lat: 37, lon: 18 },
        { name: 'MAR\nROJO', lat: 20, lon: 40 },
      ], Math.max(10, Math.round(w / 70)), true);
    } else if (gameMode === 'colombia') {
      // Mares y países vecinos (sin nombres de departamentos: serían la respuesta)
      drawLabels([
        { name: 'MAR CARIBE', lat: 12.4, lon: -77.5 },
        { name: 'OCÉANO\nPACÍFICO', lat: 3.2, lon: -80.6 },
      ], Math.max(10, Math.round(w / 60)), true);
      const nfs = Math.max(9, Math.round(w / 75));
      ctx.font = `600 ${nfs}px Poppins, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const l of [
        { name: 'VENEZUELA', lat: 8.4, lon: -68.4 }, { name: 'ECUADOR', lat: -1.3, lon: -78.2 }, { name: 'PERÚ', lat: -3.9, lon: -73.6 },
        { name: 'BRASIL', lat: -2.2, lon: -68.1 }, { name: 'PANAMÁ', lat: 8.55, lon: -80.6 },
      ]) {
        const p = geoToPixel(l.lon, l.lat);
        const name = mapLabel(l.name, locale);
        const tw = ctx.measureText(name).width;
        if (p.x + tw / 2 < 0 || p.x - tw / 2 > w || p.y < 0 || p.y > h) continue;
        ctx.fillText(name, Math.min(Math.max(p.x, tw / 2 + 6), w - tw / 2 - 6), p.y);
      }
    } else if (gameMode === 'americas') {
      drawLabels([
        { name: 'AMÉRICA\nDEL NORTE', lat: 50, lon: -105 },
        { name: 'AMÉRICA\nCENTRAL', lat: 15, lon: -85 },
        { name: 'AMÉRICA\nDEL SUR', lat: -20, lon: -58 },
      ], Math.max(10, Math.round(w / 70)));
      drawLabels([
        { name: 'OCÉANO\nPACÍFICO', lat: 10, lon: -155 },
        { name: 'OCÉANO\nATLÁNTICO', lat: 20, lon: -38 },
        { name: 'MAR\nCARIBE', lat: 18, lon: -72 },
      ], Math.max(10, Math.round(w / 70)), true);
    }

    // Decoración del Pacífico sur — solo modo Mundial (balón o copa PNG; emoji de respaldo)
    if (fieldGreen) {
      const c0 = geoToPixel(-140, -36);
      const size = Math.max(50, Math.min(w, h) * 0.26);
      const img = decorImgRef.current;
      if (img && decorReady && img.naturalWidth > 0) {
        const ar = img.naturalHeight / img.naturalWidth || 1;
        let dw: number, dh: number;
        if (pacificDecor === 'trophy') {
          // La copa es alta y angosta: fijamos su ALTURA a la del balón para que NO sea
          // más grande que el balón, manteniendo su proporción (sin deformar).
          dh = size * 0.92;
          dw = dh / ar;
        } else {
          dw = size;
          dh = size * ar;
        }
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.drawImage(img, c0.x - dw / 2, c0.y - dh / 2, dw, dh);
        ctx.restore();
      }
      // sin fallback emoji: evita ver el "balón antiguo"; el PNG carga en milisegundos
    }
  }, [gameMode, bounds, lonRange, latRange, theme, scale, offsetX, offsetY, highlightContinent, highlightCountry, highlightShape, fieldGreen, pacificDecor, decorReady, detailMap, visibleBox, viewBounds, zoomedView, packOn, packShapes, packInfo, locale]);

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
  // Pines y etiquetas de la respuesta ya ubicados (px del lienzo): el acercamiento CSS los lee para no sacarlos del cuadro
  const answerRectsRef = useRef<Rect[]>([]);
  // Onda del combo: arranca con cada clic nuevo (no se repite al re-encuadrar la misma respuesta)
  const fxClickRef = useRef<{ lat: number; lon: number } | null>(null);
  const fxStartRef = useRef(0);

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

    // Puntos sueltos: editor de quizzes (disponibles en turquesa tenue, elegidos en amarillo con borde) y, con una
    // respuesta en pantalla, los toques de los demás jugadores de la sala en vivo
    const paintMarkers = () => {
      for (const m of markers ?? []) {
        const x = lonToX(m.lon), y = latToY(m.lat);
        ctx.beginPath();
        ctx.arc(x, y, m.on ? 5.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = m.on ? BRAND.yellow : rgba(BRAND_RGB.turquoise, 0.7);
        ctx.fill();
        ctx.lineWidth = m.on ? 2 : 1;
        ctx.strokeStyle = BRAND.navyDeep;
        ctx.stroke();
      }
    };

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
      paintMarkers();
      lineProgressRef.current = 0;
      return;
    }

    const ux = lonToX(userClick.lon);
    const uy = latToY(userClick.lat);
    const cx = lonToX(correctLocation.lon);
    const cy = latToY(correctLocation.lat);
    if (fxClickRef.current !== userClick) { fxClickRef.current = userClick; fxStartRef.current = performance.now(); }
    const fxOn = !!pinFx && !prefersReducedMotion();

    // ── Curva de la respuesta (la misma que dibuja la animación) ──
    const ddx = cx - ux, ddy = cy - uy;
    const dist0 = Math.sqrt(ddx * ddx + ddy * ddy);
    const bulge0 = Math.min(dist0 * 0.2, 60);
    const cpx0 = (ux + cx) / 2 - (ddy / (dist0 || 1)) * bulge0;
    const cpy0 = (uy + cy) / 2 + (ddx / (dist0 || 1)) * bulge0;
    const curvePt = (t: number): Pt => {
      const u = 1 - t;
      return { x: u * u * ux + 2 * u * t * cpx0 + t * t * cx, y: u * u * uy + 2 * u * t * cpy0 + t * t * cy };
    };

    // ── Etiquetas (src/lib/mapLabels.ts): se ubican una vez para esta respuesta, evitando los pines, la
    // línea, la tarjeta de respuesta, los botones de zoom y la leyenda ──
    const W = dimensions.w, H = dimensions.h;
    const avTop = Math.min(0.4, labelAvoid?.top ?? 0), avBottom = Math.min(0.6, labelAvoid?.bottom ?? 0);
    const area: Rect = { x: 4, y: H * avTop + 4, w: W * (1 - Math.min(0.6, labelAvoid?.right ?? 0)) - 8, h: H * (1 - avTop - avBottom) - 8 };
    const rx = rivalClick ? lonToX(rivalClick.lon) : 0;
    const ry = rivalClick ? latToY(rivalClick.lat) : 0;
    const hard: Rect[] = [rectAround({ x: ux, y: uy }, 12), rectAround({ x: cx, y: cy }, 17)];
    if (rivalClick) hard.push(rectAround({ x: rx, y: ry }, 11));
    if (showZoomControls) { const zw = window.innerWidth >= 640 ? 168 : 140; hard.push({ x: W - zw, y: H - 62, w: zw, h: 62 }); }
    if (labelAvoid?.corner) hard.push({ x: 0, y: H - labelAvoid.corner.h, w: labelAvoid.corner.w, h: labelAvoid.corner.h });
    const soft: Rect[] = [];
    for (let i = 1; i < 12; i++) soft.push(rectAround(curvePt(i / 12), 5));
    if (rivalClick) for (let i = 1; i < 8; i++) soft.push(rectAround({ x: rx + ((cx - rx) * i) / 8, y: ry + ((cy - ry) * i) / 8 }, 5));
    const textW = (text: string, font: string) => { ctx.font = font; return ctx.measureText(text).width; };
    // Mapas pequeños (celular en horizontal): letra de 12 px; en los demás, 13 px. En la vista mundial
    // (la línea antes de la tarjeta) un punto menos: el acercamiento CSS de la respuesta ya las agranda.
    const compactMap = Math.min(W, H) < 420;
    const worldStage = !viewBounds;
    const pillFont = worldStage ? (compactMap ? PILL_FONT_SM : PILL_FONT) : compactMap ? PILL_FONT : PILL_FONT_LG;
    const distFont = worldStage ? (compactMap ? DIST_FONT_SM : DIST_FONT) : compactMap ? DIST_FONT : DIST_FONT_LG;
    const pillH = worldStage ? (compactMap ? 20 : 22) : compactMap ? 24 : 26;
    const distText = distanceKm != null ? `${Math.round(distanceKm).toLocaleString(appNumberLocale())} km` : null;
    const rivalText = rivalClick
      ? (rivalClick.distanceKm != null ? `${rivalClick.label} · ${Math.round(rivalClick.distanceKm).toLocaleString(appNumberLocale())} km` : rivalClick.label)
      : null;
    const reqs: PillRequest[] = [];
    if (pinLabels) {
      reqs.push({ key: 'correct', w: textW(pinLabels.correct, pillFont) + 18, h: pillH, anchor: { x: cx, y: cy }, r: 17, away: { x: ux, y: uy }, prefer: -1 });
      reqs.push({ key: 'you', w: textW(pinLabels.you, pillFont) + 18, h: pillH, anchor: { x: ux, y: uy }, r: 12, away: { x: cx, y: cy }, prefer: 1 });
    }
    if (rivalText) reqs.push({ key: 'rival', w: textW(rivalText, pillFont) + 18, h: pillH, anchor: { x: rx, y: ry }, r: 11, away: { x: cx, y: cy }, prefer: -1 });
    if (distText) {
      // La distancia va sobre la curva; si los pines están muy juntos, alrededor de ellos
      const dw = textW(distText, distFont) + 18, dh = pillH + 2;
      const mid = curvePt(0.5);
      const spots: Pt[] = [0.5, 0.4, 0.6, 0.32, 0.68].map(curvePt);
      const nx = -ddy / (dist0 || 1), ny = ddx / (dist0 || 1);
      for (const k of [1, -1]) spots.push({ x: mid.x + nx * k * (dh / 2 + 12), y: mid.y + ny * k * (dh / 2 + 12) });
      for (const rad of [40, 66, 96]) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          spots.push({ x: mid.x + dx * (rad * 0.6 + dw / 2), y: mid.y + dy * rad * 0.75 });
        }
      }
      reqs.push({ key: 'distance', w: dw, h: dh, anchor: mid, r: 0, spots, ignoreSoft: true });
    }
    const pills = layoutPills(reqs, hard, soft, area);
    const pill = (key: string) => pills.find((pl) => pl.key === key);
    answerRectsRef.current = [...hard.slice(0, rivalClick ? 3 : 2), ...pills.map((pl) => pl.rect)];

    // ── Nombres de países en la vista acercada: el país de la ciudad (foco, en mayúsculas), el que
    // tocaste y los vecinos. Sin choques con pines, etiquetas ni la línea; si no caben, se omiten.
    type CountryLabel = { text: string; x: number; y: number; font: string; spacing: string };
    let countryLabels: CountryLabel[] = [];
    if (detailMap && !isPackMode(gameMode)) {
      const map = detailMap;
      const vis = visibleBox(W, H);
      const focus = countryAt(map, correctLocation.lon, correctLocation.lat);
      const clicked = countryAt(map, userClick.lon, userClick.lat);
      const order: number[] = [];
      const add = (i: number) => { if (i >= 0 && !order.includes(i) && boxesIntersect(map.countries[i].bbox, vis)) order.push(i); };
      add(focus);
      add(clicked);
      if (focus >= 0) map.neighbors[focus].forEach(add);
      if (rivalClick) add(countryAt(map, rivalClick.lon, rivalClick.lat));
      if (clicked >= 0 && clicked !== focus) map.neighbors[clicked].forEach(add);
      const small = compactMap;
      const free = { x0: area.x, y0: area.y, x1: area.x + area.w, y1: area.y + area.h };
      const blockers: Rect[] = [
        rectAround({ x: ux, y: uy }, 18), rectAround({ x: cx, y: cy }, 22),
        ...(rivalClick ? [rectAround({ x: rx, y: ry }, 16)] : []),
        ...hard.slice(rivalClick ? 3 : 2),
        ...pills.map((pl) => ({ x: pl.rect.x - 4, y: pl.rect.y - 4, w: pl.rect.w + 8, h: pl.rect.h + 8 })),
        ...soft,
      ];
      const seen = new Set<string>();
      const meta = new Map<string, { text: string; font: string; spacing: string }>();
      const items: { key: string; w: number; h: number; spots: Pt[] }[] = [];
      for (const i of order.slice(0, 16)) {
        const name = countryDisplayName(map.countries[i].name, locale);
        if (seen.has(name)) continue;
        seen.add(name);
        const isFocus = i === focus;
        const text = isFocus ? name.toLocaleUpperCase(locale) : name;
        const font = isFocus ? `800 ${small ? 12 : 14}px Poppins, system-ui, sans-serif` : `600 ${small ? 10.5 : 12}px Poppins, system-ui, sans-serif`;
        const spacing = isFocus ? '1px' : '0px';
        ctx.font = font;
        ctx.letterSpacing = spacing;
        const tw = ctx.measureText(text).width;
        ctx.letterSpacing = '0px';
        const th = isFocus ? (small ? 16 : 19) : (small ? 14 : 16);
        let spots: Pt[] = labelSpots(map.countries[i], lonToX, latToY, vis, W, H, free, isFocus ? 6 : 4);
        if (isFocus && spots.length) {
          // País pequeño o tapado por los pines: probar también justo arriba y abajo de su centro
          const b = spots[0];
          spots = [...spots, { x: b.x, y: b.y - th - 10 }, { x: b.x, y: b.y + th + 10 }, { x: b.x, y: b.y - 2 * th - 14 }, { x: b.x, y: b.y + 2 * th + 14 }];
        } else if (!isFocus) {
          spots = (spots as { x: number; y: number; depth: number }[]).filter((sp) => sp.depth >= Math.min(7, th / 2));
        }
        items.push({ key: String(i), w: tw + 6, h: th, spots });
        meta.set(String(i), { text, font, spacing });
      }
      countryLabels = layoutTexts(items, blockers, area).map((pl) => ({ ...meta.get(pl.key)!, x: pl.x, y: pl.y }));
    }

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
      paintMarkers();

      if (countryLabels.length) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        for (const l of countryLabels) {
          ctx.font = l.font;
          ctx.letterSpacing = l.spacing;
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = 'rgba(255,255,255,0.72)';
          ctx.strokeText(l.text, l.x, l.y);
          ctx.fillStyle = BRAND.navyDeep;
          ctx.fillText(l.text, l.x, l.y);
        }
        ctx.letterSpacing = '0px';
      }

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
      const pinFill = pinConfig?.fill ?? (neon ? BRAND.yellow : '#4fc3f7');
      const pinGlow = pinConfig?.glow ?? (neon ? rgba(BRAND_RGB.yellow, 0.4) : 'rgba(79,195,247,0.3)');
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

      // ── Juice del combo: onda expansiva (todo acierto) y chispas (desde ×1,2) en tu pin ──
      const fxT = (performance.now() - fxStartRef.current) / 700;
      if (fxOn && fxT < 1 && pinFx) {
        const e = 1 - Math.pow(1 - fxT, 3);
        const fxRgb = pinFx.level >= 4 ? '255,138,61' : pinFx.level >= 1 ? BRAND_RGB.turquoise : BRAND_RGB.yellow;
        ctx.save();
        ctx.strokeStyle = `rgba(${fxRgb},${0.9 * (1 - fxT)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ux, uy, 10 + e * 46, 0, Math.PI * 2);
        ctx.stroke();
        if (pinFx.level >= 1) {
          const n = 8 + pinFx.level * 2;
          ctx.lineCap = 'round';
          ctx.lineWidth = 2.5;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + 0.3;
            const r1 = 12 + e * 22, r2 = 16 + e * (30 + pinFx.level * 4);
            ctx.beginPath();
            ctx.moveTo(ux + Math.cos(a) * r1, uy + Math.sin(a) * r1);
            ctx.lineTo(ux + Math.cos(a) * r2, uy + Math.sin(a) * r2);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Show correct pin and distance label only when line is complete
      if (progress >= 1) {
        // Correct pin — large vivid beacon impossible to miss
        // Rediseño v2: la ciudad correcta siempre en turquesa (la cercanía la cuenta el trazo y la tarjeta)
        const beaconColor = neon ? BRAND.turquoise : ((distanceKm ?? 9999) < 500 ? '#22c55e' : '#ef4444');
        const beaconGlow = neon ? `rgba(${BRAND_RGB.turquoise},` : ((distanceKm ?? 9999) < 500 ? 'rgba(34,197,94,' : 'rgba(239,68,68,');
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

        const drawPill = (pl: PlacedPill | undefined, text: string, bg: string, fg: string, font: string, radius: number) => {
          if (!pl) return;
          const bw = pl.rect.w, bh = pl.rect.h;
          const bx = Math.min(Math.max(2, pl.rect.x), W - bw - 2);
          const by = Math.min(Math.max(2, pl.rect.y), H - bh - 2);
          if (pl.leader) {
            // Etiqueta alejada de su pin: línea guía desde el borde del pin
            const e = nearestOnRect({ x: bx, y: by, w: bw, h: bh }, pl.anchor);
            const len = Math.hypot(e.x - pl.anchor.x, e.y - pl.anchor.y) || 1;
            ctx.strokeStyle = bg;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(pl.anchor.x + ((e.x - pl.anchor.x) / len) * pl.r, pl.anchor.y + ((e.y - pl.anchor.y) / len) * pl.r);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
          }
          ctx.fillStyle = bg;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, radius); else ctx.rect(bx, by, bw, bh);
          ctx.fill();
          ctx.font = font;
          ctx.fillStyle = fg;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
        };
        // ── Respuesta del rival (maqueta Reto_Revision_Mapa): línea punteada turquesa + pin ──
        if (rivalClick) {
          ctx.save();
          ctx.setLineDash([7, 6]);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = rgba(BRAND_RGB.turquoise, 0.9);
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(cx, cy); ctx.stroke();
          ctx.restore();
          ctx.fillStyle = BRAND.turquoise;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(rx, ry, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        // ── Etiquetas (maqueta Feedback_APROBADA_v1), ya ubicadas sin choques ──
        if (distText) drawPill(pill('distance'), distText, 'rgba(0,0,0,0.78)', '#fff', distFont, 8);
        if (rivalText) drawPill(pill('rival'), rivalText, BRAND.turquoise, BRAND.navyDeep, pillFont, pillH / 2);
        if (pinLabels) {
          drawPill(pill('correct'), pinLabels.correct, BRAND.turquoise, BRAND.navyDeep, pillFont, pillH / 2);
          drawPill(pill('you'), pinLabels.you, BRAND.yellow, BRAND.navyDeep, pillFont, pillH / 2);
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
  }, [dimensions, userClick, correctLocation, distanceKm, lonToX, latToY, theme, pinConfig, pinEmoji, trailConfig, decorReady, pinLabels?.you, pinLabels?.correct, rivalClick, detailMap, labelAvoid, locale, showZoomControls, visibleBox, pinFx, markers]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Zoom y paneo manuales: pellizco (acerca y mueve sin soltar), un dedo o el ratón arrastran el mapa acercado,
  // rueda y botones −/+/⌖. El toque corto con un dedo sigue siendo la respuesta. ──
  const applyView = useCallback((v: MapView, animate = false) => {
    viewRef.current = v;
    setZoomLabel(Math.round(v.z * 10) / 10);
    const el = canvasRef.current;
    if (!el || zoomBombActiveRef.current) return; // el vuelo de la respuesta es dueño del lienzo
    el.style.transformOrigin = '0 0';
    el.style.transition = animate ? 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    el.style.transform = viewTransform(v);
    el.style.willChange = isIdentityView(v) ? '' : 'transform';
  }, []);

  const containerBox = () => {
    const r = containerRef.current?.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  };
  const learnDrag = useCallback(() => {
    setDragLearned(true);
    try { localStorage.setItem('geospeed_map_drag_learned', '1'); } catch { /* sin almacenamiento */ }
  }, []);

  const startPinch = (touches: React.TouchList | TouchList, rect: DOMRect) => {
    const a = touches[0], b = touches[1];
    gestureRef.current = {
      kind: 'pinch',
      dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      mid: { x: (a.clientX + b.clientX) / 2 - rect.left, y: (a.clientY + b.clientY) / 2 - rect.top },
      start: viewRef.current,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoomBombActiveRef.current || (e.target as Element).closest?.('button')) { gestureRef.current = null; return; }
    const rect = containerBox();
    if (!rect) return;
    if (e.touches.length >= 2) startPinch(e.touches, rect);
    else if (e.touches.length === 1) {
      const t0 = e.touches[0];
      gestureRef.current = { kind: 'one', sx: t0.clientX, sy: t0.clientY, start: viewRef.current, dragging: false };
    }
  }, []);

  const handleTouchMoveRef = useRef((_e: TouchEvent) => {});
  handleTouchMoveRef.current = (e: TouchEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    const rect = containerBox();
    if (!rect) return;
    if (g.kind === 'pinch' && e.touches.length >= 2) {
      e.preventDefault();
      const a = e.touches[0], b = e.touches[1];
      const mid = { x: (a.clientX + b.clientX) / 2 - rect.left, y: (a.clientY + b.clientY) / 2 - rect.top };
      applyView(pinchView(g.start, g.dist, g.mid, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), mid, rect.width, rect.height));
    } else if (g.kind === 'one' && e.touches.length === 1) {
      const t0 = e.touches[0];
      const dx = t0.clientX - g.sx, dy = t0.clientY - g.sy;
      if (!g.dragging) {
        // Sin zoom no hay nada que mover; un temblor corto del dedo sigue siendo un toque
        if (g.start.z <= 1.001 || Math.hypot(dx, dy) < DRAG_SLOP_TOUCH) return;
        g.dragging = true;
        learnDrag();
      }
      e.preventDefault();
      applyView(panView(g.start, dx, dy, rect.width, rect.height));
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.kind === 'pinch' || g.dragging) suppressClickUntil.current = performance.now() + 350;
    const rect = containerBox();
    if (e.touches.length >= 2 && rect) startPinch(e.touches, rect);
    else if (e.touches.length === 1 && g.kind === 'pinch') {
      // Levantó un dedo del pellizco: el que queda sigue moviendo el mapa (sin responder)
      const t0 = e.touches[0];
      gestureRef.current = { kind: 'one', sx: t0.clientX, sy: t0.clientY, start: viewRef.current, dragging: true };
    } else if (e.touches.length === 0) gestureRef.current = null;
  }, []);

  // ── Rueda del ratón / pellizco del trackpad (escritorio): acerca hacia el cursor ──
  const wheelHandlerRef = useRef((_e: WheelEvent) => {});
  wheelHandlerRef.current = (e: WheelEvent) => {
    e.preventDefault();
    if (zoomBombActiveRef.current) return;
    const rect = containerBox();
    if (!rect) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
    const dy = Math.max(-120, Math.min(120, e.deltaY * unit));
    const factor = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.002)); // ctrlKey = pellizco del trackpad (deltas pequeños)
    applyView(zoomAround(viewRef.current, factor, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => wheelHandlerRef.current(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ── Arrastre con el ratón (escritorio) cuando el mapa está acercado; un clic sin arrastre responde ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || zoomBombActiveRef.current) return;
    if ((e.target as Element).closest?.('button')) return;
    const sx = e.clientX, sy = e.clientY, start = viewRef.current;
    if (start.z <= 1.001) return;
    let dragging = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!dragging) {
        if (Math.hypot(dx, dy) < DRAG_SLOP_MOUSE) return;
        dragging = true;
        setGrabbing(true);
        learnDrag();
      }
      const rect = containerBox();
      if (rect) applyView(panView(start, dx, dy, rect.width, rect.height));
    };
    const up = () => {
      cleanup();
      if (dragging) { suppressClickUntil.current = performance.now() + 350; setGrabbing(false); }
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      mouseDragCleanupRef.current = null;
    };
    mouseDragCleanupRef.current?.();
    mouseDragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [applyView, learnDrag]);
  useEffect(() => () => mouseDragCleanupRef.current?.(), []);

  // ── Botones −/+/⌖ (acercan hacia el centro de lo que se ve; el zoom se queda hasta responder) ──
  const zoomBy = useCallback((factor: number) => {
    const rect = containerBox();
    if (!rect || zoomBombActiveRef.current) return;
    applyView(zoomAround(viewRef.current, factor, rect.width / 2, rect.height / 2, rect.width, rect.height), true);
  }, [applyView]);
  const resetZoom = useCallback(() => {
    gestureRef.current = null;
    applyView(IDENTITY_VIEW, true);
  }, [applyView]);
  // Nuevo encuadre (respuesta de la ronda, otra ciudad en la revisión) → quitar el zoom/paneo manual
  useEffect(() => {
    gestureRef.current = null;
    applyView(IDENTITY_VIEW);
  }, [viewBounds, applyView]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Unlock audio on first tap/click — required for iOS Safari Web Audio
    unlockAudio();
    if (clickDisabled) return;
    if (performance.now() < suppressClickUntil.current) return; // fin de un arrastre o pellizco, no una respuesta
    // Use CONTAINER rect (not canvas) — canvas has CSS transform that skews getBoundingClientRect
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = toLogical(viewRef.current, e.clientX - rect.left, e.clientY - rect.top);
    onMapClick(yToLat(p.y), xToLon(p.x), e.clientX, e.clientY);
  }, [clickDisabled, onMapClick, xToLon, yToLat]);

  // ── Cursor coordinate tracking ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCursorMove) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = toLogical(viewRef.current, e.clientX - rect.left, e.clientY - rect.top);
    onCursorMove(yToLat(p.y), xToLon(p.x));
  }, [onCursorMove, xToLon, yToLat]);

  // ── ZOOM BOMB — Smooth cinematic camera flight to result ──
  // Phase 1: Gentle zoom to user click (0-600ms)
  // Phase 2: Smooth pan to midpoint (600-1600ms)
  // Phase 3: Hold with breathing (1600-3000ms)
  // Phase 4: Graceful pull-back to overview (3000-4800ms)
  useEffect(() => {
    if (!userClick || !correctLocation || !containerRef.current) {
      return;
    }

    // Respondió con el mapa acercado a mano: volver suave a la vista completa antes del vuelo de la respuesta
    // (si no, la ciudad correcta y la línea podían quedar fuera del cuadro)
    const hadManual = !viewBounds && !zoomBombActiveRef.current && !isIdentityView(viewRef.current);
    if (hadManual) {
      gestureRef.current = null;
      applyView(IDENTITY_VIEW, true);
    }

    // Respect reduced motion preference
    if (prefersReducedMotion()) return;

    // Cancel any previous zoom bomb
    if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);

    // Vuelta suave a escala 1 (también si este efecto se repite y ya no toca acercar: el lienzo no debe
    // quedar congelado en el acercamiento anterior)
    const resetZoomCss = () => {
      const wasFlying = zoomBombActiveRef.current;
      zoomBombActiveRef.current = false;
      if (!wasFlying && !isIdentityView(viewRef.current)) return; // zoom manual del jugador (revisión): se queda
      const el = canvasRef.current;
      if (el) {
        el.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'scale(1)';
        el.style.transformOrigin = '50% 50%';
      }
    };
    // Con un encuadre fijo (respuesta de la ronda, revisión) el mapa ya está acercado de verdad:
    // quitar el zoom CSS para no sumar los dos acercamientos
    if (viewBounds) {
      resetZoomCss();
      return;
    }

    const vw = window.innerWidth;
    const uxPct = (lonToX(userClick.lon) / dimensions.w) * 100;
    const uyPct = (latToY(userClick.lat) / dimensions.h) * 100;
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

    // Tope del acercamiento (src/lib/mapZoom.ts): ni los pines ni sus etiquetas ("Tu respuesta", "Ciudad
    // correcta", la distancia, el rival), ya ubicadas por el efecto de dibujo (corre antes que este), pueden
    // salir del cuadro; el origen del pico es el que deja todo eso centrado, y cada cuadro de la animación
    // vuelve a comprobarlo. Antes solo se cuidaban los pines con un margen fijo alrededor del punto medio y
    // las etiquetas que cuelgan de ellos quedaban cortadas por el borde.
    const W = dimensions.w, H = dimensions.h;
    const click = { x: lonToX(userClick.lon), y: latToY(userClick.lat) };
    const keep: Rect[] = [
      rectAround(click, 14),
      rectAround({ x: lonToX(correctLocation.lon), y: latToY(correctLocation.lat) }, 19),
      ...(rivalClick ? [rectAround({ x: lonToX(rivalClick.lon), y: latToY(rivalClick.lat) }, 13)] : []),
      ...answerRectsRef.current,
    ];
    const plan = planAnswerZoom(keep, click, peakZoom, W, H);
    if (!plan) { resetZoomCss(); return; } // casi no acercaría: mejor dejar el mapa quieto
    peakZoom = plan.peak;
    const punchZoom = plan.punch;
    const mxPct = (plan.origin.x / W) * 100;
    const myPct = (plan.origin.y / H) * 100;

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
        return;
      }

      currentZoom = clampZoomFrame(keep, { x: (originX / 100) * W, y: (originY / 100) * H }, currentZoom, W, H);

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

    // Small delay so the click registers visually first (o lo que tarda en volver el zoom manual)
    const kickoff = setTimeout(() => {
      zoomBombRafRef.current = requestAnimationFrame(animateZoom);
    }, hadManual ? 320 : 100);

    return () => {
      clearTimeout(kickoff);
      if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);
    };
  }, [userClick, correctLocation, rivalClick, bounds, lonRange, latRange, lonToX, latToY, dimensions, viewBounds, applyView]);

  // Reset zoom when markers clear
  useEffect(() => {
    if (!userClick && !correctLocation) {
      if (zoomBombRafRef.current) cancelAnimationFrame(zoomBombRafRef.current);
      zoomBombActiveRef.current = false;
      // Ronda nueva: también se quita el zoom manual de la anterior
      viewRef.current = IDENTITY_VIEW;
      gestureRef.current = null;
      setZoomLabel(1);
      // Smooth pullback via DOM
      const el = canvasRef.current;
      if (el) {
        el.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'scale(1)';
        el.style.transformOrigin = '50% 50%';
      }
    }
  }, [userClick, correctLocation]);
  // Ocean background colors — must match exactly what drawBaseMap paints as ocean.
  // This makes letterbox areas (when geo ratio ≠ container ratio) visually seamless:
  // the "empty" space around the canvas looks like ocean instead of a black bar.
  // ── Custom crosshair cursor (Phase 4) ──
  const crosshairCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='none' stroke='%23FFD93B' stroke-width='1.5' opacity='0.7'/%3E%3Ccircle cx='16' cy='16' r='2' fill='%23FFD93B' opacity='0.9'/%3E%3Cline x1='16' y1='0' x2='16' y2='10' stroke='%23FFD93B' stroke-width='1' opacity='0.5'/%3E%3Cline x1='16' y1='22' x2='16' y2='32' stroke='%23FFD93B' stroke-width='1' opacity='0.5'/%3E%3Cline x1='0' y1='16' x2='10' y2='16' stroke='%23FFD93B' stroke-width='1' opacity='0.5'/%3E%3Cline x1='22' y1='16' x2='32' y2='16' stroke='%23FFD93B' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E") 16 16, crosshair`;

  const oceanBg = fieldGreen
    ? 'linear-gradient(180deg, #1c4a30 0%, #163a26 50%, #102c1c 100%)'
    : theme === 'light'
    ? 'linear-gradient(180deg, #C8E8F4 0%, #98C8E4 50%, #84B8DC 100%)'
    : theme === 'neon'
      ? 'linear-gradient(180deg, hsl(var(--brand-navy-deep)) 0%, hsl(var(--brand-navy)) 50%, hsl(var(--brand-navy-deep)) 100%)'
      : 'linear-gradient(180deg, #EDE0C8 0%, #E8D8BC 50%, #E0CEB0 100%)';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '50dvh',  background: oceanBg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
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
          cursor: clickDisabled ? 'default' : grabbing ? 'grabbing' : crosshairCursor,
          // transform / transform-origin / transition NO van aquí: los escriben directo en el DOM el zoom manual
          // (applyView) y el vuelo de la respuesta (rAF); si React los tuviera, pisaría esos valores al re-renderizar.
        }}
      />
      {/* Zoom indicator */}
      {zoomLabel > 1.05 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold tabular-nums px-2 py-1 rounded-full pointer-events-none">
          {zoomLabel.toLocaleString(appNumberLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x
        </div>
      )}
      {/* Controles de zoom (maqueta): −  +  ⌖ */}
      {showZoomControls && (
        <div className="absolute z-[8] flex flex-col items-end gap-1.5" style={{ right: 'max(0.75rem, var(--sar))', bottom: 'max(0.75rem, var(--sab))' }}>
          {/* Pista hasta que el jugador arrastre el mapa por primera vez */}
          {zoomLabel > 1.05 && !dragLearned && !clickDisabled && (
            <span className="pointer-events-none rounded-full px-3 py-1 text-[11px] short:text-[10px] font-semibold border border-accent/50 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
              ✋ {t('map_dragHint')}
            </span>
          )}
          <div className="flex items-center gap-2 sm:gap-2.5">
          {([
            { icon: <path d="M6 12h12" />, onClick: () => zoomBy(1 / 1.4), aria: t('map_zoomOut') },
            { icon: <><path d="M6 12h12" /><path d="M12 6v12" /></>, onClick: () => zoomBy(1.4), aria: t('map_zoomIn') },
            { icon: <><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M12 2.5v3" /><path d="M12 18.5v3" /><path d="M2.5 12h3" /><path d="M18.5 12h3" /></>, onClick: resetZoom, aria: t('map_recenter') },
          ]).map(b => (
            <button
              key={b.aria}
              type="button"
              onClick={(e) => { e.stopPropagation(); b.onClick(); }}
              onTouchEnd={(e) => e.stopPropagation()}
              className="w-9 h-9 sm:w-11 sm:h-11 short:w-9 short:h-9 rounded-full border-2 border-accent/70 text-foreground flex items-center justify-center backdrop-blur-md transition-all active:scale-90 hover:bg-accent/15"
              style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}
              aria-label={b.aria}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 short:w-4 short:h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>{b.icon}</svg>
            </button>
          ))}
          </div>
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const regionBounds = getMapBounds(gameMode);
    const worldBounds = getMapBounds('world');
    // Tamaño fijo en px CSS: antes se leía canvas.width (ya multiplicado por el DPR) y, como el efecto se
    // repetía en cada render, el lienzo se duplicaba hasta romperse (ícono de imagen rota en Europa).
    const w = 120;
    const h = 65;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

    ctx.strokeStyle = BRAND.yellow;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(BRAND_RGB.yellow, 0.12);
    ctx.fillRect(rx, ry, rw, rh);
  }, [gameMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-2 left-2 rounded-lg border border-white/20 shadow-lg pointer-events-none"
      style={{ opacity: 0.85, width: 120, height: 65 }}
    />
  );
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  ctx.fillStyle = BRAND.yellow;
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

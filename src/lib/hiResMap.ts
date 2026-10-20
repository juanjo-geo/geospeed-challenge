/**
 * Mapa detallado para las vistas con zoom (respuesta de la ronda, revisión por ciudad, mapa del reto,
 * modos regionales). Natural Earth 1:50m con topología (src/data/countriesHiRes.json, generado por
 * scripts/build-hires-map.mjs). El mapa del mundo y la lógica del juego siguen con countries.ts (1:110m).
 *
 * Con la topología cada frontera es un arco compartido: se dibuja una sola vez (antes cada país trazaba
 * su contorno y las fronteras salían dobles y desalineadas al acercar), y los vecinos de un país son
 * los países con los que comparte un arco.
 */

type Box = [number, number, number, number]; // lonMin, latMin, lonMax, latMax

interface RawMap {
  q: number;
  arcs: number[][];
  geoms: { n: string; r?: string; p: number[][][] }[];
}

export interface HiResCountry {
  /** Nombre Natural Earth (igual que countries.ts cuando el país existe allí) */
  name: string;
  /** País de countries.ts que da el continente y el color (el mismo nombre, o el vecino más cercano) */
  ref: string;
  /** Anillos armados: [lon, lat, lon, lat, …] */
  rings: Float64Array[];
  ringBoxes: Box[];
  bbox: Box;
}

export interface HiResMap {
  countries: HiResCountry[];
  /** Trazos de cada arco para dibujar (varias copias si cruza la línea de cambio de fecha) */
  arcs: Float64Array[][];
  arcBoxes: Box[][];
  /** Arcos entre dos países distintos (fronteras) */
  borderArcs: number[];
  /** Arcos de un solo país (costas) */
  coastArcs: number[];
  neighbors: Set<number>[];
}

let loaded: HiResMap | null = null;
let loading: Promise<HiResMap> | null = null;

/** El mapa detallado si ya se cargó (sin esperar) */
export const getHiResMap = () => loaded;

/** Carga el mapa detallado una sola vez (chunk aparte de ≈120 KB gzip) */
export function loadHiResMap(): Promise<HiResMap> {
  if (loaded) return Promise.resolve(loaded);
  if (!loading) {
    // ?raw: llega como texto (JSON.parse es más rápido que evaluar un objeto JS gigante y TypeScript
    // no intenta inferir el tipo de 350 KB de datos)
    loading = import('@/data/countriesHiRes.json?raw')
      .then((m) => { loaded = decode(JSON.parse(m.default) as RawMap); return loaded; })
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

const emptyBox = (): Box => [Infinity, Infinity, -Infinity, -Infinity];
const grow = (b: Box, lon: number, lat: number) => {
  if (lon < b[0]) b[0] = lon; if (lat < b[1]) b[1] = lat;
  if (lon > b[2]) b[2] = lon; if (lat > b[3]) b[3] = lat;
};
export const boxesIntersect = (a: Box, b: Box) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

const boxOf = (pts: Float64Array): Box => { const b = emptyBox(); for (let i = 0; i < pts.length; i += 2) grow(b, pts[i], pts[i + 1]); return b; };

/**
 * Los datos de world-atlas están pensados para un globo: Rusia (Chukotka), Fiyi y la Antártida cruzan
 * ±180° y en un mapa plano ese salto se dibujaba como una franja de lado a lado. Se "desenvuelve" la
 * longitud (sin saltos de más de 180°) y, si la figura se sale de [-180, 180], se agrega una copia
 * desplazada 360° para el otro borde del mapa.
 */
function unwrapLon(pts: Float64Array) {
  let shift = 0;
  for (let i = 2; i < pts.length; i += 2) {
    const prev = pts[i - 2];
    let lon = pts[i] + shift;
    if (lon - prev > 180) { shift -= 360; lon -= 360; } else if (lon - prev < -180) { shift += 360; lon += 360; }
    pts[i] = lon;
  }
}
function withCopies(pts: Float64Array): Float64Array[] {
  const b = boxOf(pts);
  const out = [pts];
  for (const d of b[2] > 180 ? [-360] : b[0] < -180 ? [360] : []) {
    const c = new Float64Array(pts);
    for (let i = 0; i < c.length; i += 2) c[i] += d;
    out.push(c);
  }
  return out;
}

function decode(raw: RawMap): HiResMap {
  const q = raw.q;
  const raws = raw.arcs.map((flat) => {
    const out = new Float64Array(flat.length);
    let x = 0, y = 0;
    for (let i = 0; i < flat.length; i += 2) {
      x += flat[i]; y += flat[i + 1];
      out[i] = x / q - 180; out[i + 1] = y / q - 90;
    }
    return out;
  });
  const arcs = raws.map((a) => { const c = new Float64Array(a); unwrapLon(c); return withCopies(c); });
  const arcBoxes = arcs.map((copies) => copies.map(boxOf));

  const uses: number[][] = raws.map(() => []);
  const countries: HiResCountry[] = raw.geoms.map((g, ci) => {
    const rings: Float64Array[] = [];
    const ringBoxes: Box[] = [];
    const bbox = emptyBox();
    for (const polygon of g.p) {
      for (const ring of polygon) {
        let n = 0;
        for (const idx of ring) n += raws[idx < 0 ? ~idx : idx].length / 2 - 1;
        let out = new Float64Array((n + 1) * 2);
        let k = 0;
        ring.forEach((idx, j) => {
          const a = raws[idx < 0 ? ~idx : idx];
          uses[idx < 0 ? ~idx : idx].push(ci);
          const pts = a.length / 2;
          for (let s = j === 0 ? 0 : 1; s < pts; s++) {
            const p = idx < 0 ? pts - 1 - s : s;
            out[k++] = a[p * 2]; out[k++] = a[p * 2 + 1];
          }
        });
        if (k < out.length) out = out.slice(0, k);
        unwrapLon(out);
        // Anillo que rodea un polo (Antártida): tras desenvolverlo no cierra; se cierra pasando por el polo
        const first = out[0], last = out[k - 2];
        if (Math.abs(last - first) > 180) {
          let latSum = 0;
          for (let i = 1; i < k; i += 2) latSum += out[i];
          const pole = latSum < 0 ? -90 : 90;
          const closed = new Float64Array(k + 4);
          closed.set(out);
          closed[k] = last; closed[k + 1] = pole; closed[k + 2] = first; closed[k + 3] = pole;
          out = closed;
        }
        for (const copy of withCopies(out)) {
          const rb = boxOf(copy);
          grow(bbox, rb[0], rb[1]); grow(bbox, rb[2], rb[3]);
          rings.push(copy);
          ringBoxes.push(rb);
        }
      }
    }
    return { name: g.n, ref: g.r ?? g.n, rings, ringBoxes, bbox };
  });

  const borderArcs: number[] = [];
  const coastArcs: number[] = [];
  const neighbors = countries.map(() => new Set<number>());
  uses.forEach((u, a) => {
    if (u.length === 1) coastArcs.push(a);
    else if (u.length === 2 && u[0] !== u[1]) {
      borderArcs.push(a);
      neighbors[u[0]].add(u[1]); neighbors[u[1]].add(u[0]);
    }
    // usado dos veces por el mismo país: línea interna, no se dibuja
  });
  return { countries, arcs, arcBoxes, borderArcs, coastArcs, neighbors };
}

/** Traza (sin rellenar) los anillos visibles de un país. Devuelve false si ninguno es visible. */
export function traceCountry(ctx: CanvasRenderingContext2D, c: HiResCountry, x: (lon: number) => number, y: (lat: number) => number, vis: Box): boolean {
  let any = false;
  for (let r = 0; r < c.rings.length; r++) {
    if (!boxesIntersect(c.ringBoxes[r], vis)) continue;
    const pts = c.rings[r];
    ctx.moveTo(x(pts[0]), y(pts[1]));
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x(pts[i]), y(pts[i + 1]));
    ctx.closePath();
    any = true;
  }
  return any;
}

/** Traza una lista de arcos (fronteras o costas), cada uno una sola vez */
export function traceArcs(ctx: CanvasRenderingContext2D, map: HiResMap, list: number[], x: (lon: number) => number, y: (lat: number) => number, vis: Box) {
  for (const a of list) {
    const copies = map.arcs[a];
    for (let c = 0; c < copies.length; c++) {
      if (!boxesIntersect(map.arcBoxes[a][c], vis)) continue;
      const pts = copies[c];
      ctx.moveTo(x(pts[0]), y(pts[1]));
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x(pts[i]), y(pts[i + 1]));
    }
  }
}

function insideRings(rings: Float64Array[], boxes: Box[], lon: number, lat: number): boolean {
  let inside = false;
  for (let r = 0; r < rings.length; r++) {
    const b = boxes[r];
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    const p = rings[r];
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const yi = p[i + 1], yj = p[j + 1];
      if ((yi > lat) !== (yj > lat) && lon < ((p[j] - p[i]) * (lat - yi)) / (yj - yi) + p[i]) inside = !inside;
    }
  }
  return inside;
}

/**
 * País que contiene el punto; si cae en el mar junto a la costa (ciudades costeras, contornos
 * generalizados), el país más cercano a menos de ~1°. -1 si no hay ninguno.
 */
export function countryAt(map: HiResMap, lon: number, lat: number): number {
  const cs = map.countries;
  for (let i = 0; i < cs.length; i++) {
    const b = cs[i].bbox;
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    if (insideRings(cs[i].rings, cs[i].ringBoxes, lon, lat)) return i;
  }
  let best = -1, bd = 1;
  for (let i = 0; i < cs.length; i++) {
    const b = cs[i].bbox;
    if (lon < b[0] - 1 || lon > b[2] + 1 || lat < b[1] - 1 || lat > b[3] + 1) continue;
    for (const p of cs[i].rings) {
      for (let k = 0; k < p.length; k += 2) {
        const d = (p[k] - lon) ** 2 + (p[k + 1] - lat) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
    }
  }
  return best;
}

let rasterCanvas: HTMLCanvasElement | null = null;

/**
 * Puntos candidatos para escribir el nombre de un país dentro de la zona libre del mapa: se rasteriza
 * el país en una cuadrícula de `cell` px y se buscan las celdas más alejadas de su borde (o del borde
 * de la zona libre). Devuelve hasta `max` puntos separados entre sí, del más holgado al menos.
 */
export function labelSpots(
  c: HiResCountry,
  x: (lon: number) => number,
  y: (lat: number) => number,
  vis: Box,
  w: number,
  h: number,
  free: { x0: number; y0: number; x1: number; y1: number },
  max = 5,
  cell = 4,
): { x: number; y: number; depth: number }[] {
  const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
  if (gw < 2 || gh < 2) return [];
  if (!rasterCanvas) rasterCanvas = document.createElement('canvas');
  if (rasterCanvas.width !== gw) rasterCanvas.width = gw;
  if (rasterCanvas.height !== gh) rasterCanvas.height = gh;
  const ctx = rasterCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, gw, gh);
  ctx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  if (!traceCountry(ctx, c, x, y, vis)) return [];
  ctx.fill('evenodd');
  const data = ctx.getImageData(0, 0, gw, gh).data;

  // Distancia (chaflán 3-4) de cada celda del país al exterior
  const INF = 1e9;
  const d = new Float32Array(gw * gh);
  const fx0 = free.x0 / cell, fx1 = free.x1 / cell, fy0 = free.y0 / cell, fy1 = free.y1 / cell;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      const inFree = i + 0.5 >= fx0 && i + 0.5 <= fx1 && j + 0.5 >= fy0 && j + 0.5 <= fy1;
      d[k] = data[k * 4 + 3] > 127 && inFree ? INF : 0;
    }
  }
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= gw || j >= gh ? 0 : d[j * gw + i]);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      if (d[k] === 0) continue;
      d[k] = Math.min(d[k], at(i - 1, j) + 3, at(i, j - 1) + 3, at(i - 1, j - 1) + 4, at(i + 1, j - 1) + 4);
    }
  }
  for (let j = gh - 1; j >= 0; j--) {
    for (let i = gw - 1; i >= 0; i--) {
      const k = j * gw + i;
      if (d[k] === 0) continue;
      d[k] = Math.min(d[k], at(i + 1, j) + 3, at(i, j + 1) + 3, at(i + 1, j + 1) + 4, at(i - 1, j + 1) + 4);
    }
  }

  const order: number[] = [];
  for (let k = 0; k < d.length; k++) if (d[k] > 0) order.push(k);
  order.sort((a, b) => d[b] - d[a]);
  const out: { x: number; y: number; depth: number }[] = [];
  const minSep = 6; // celdas
  for (const k of order) {
    const i = k % gw, j = (k - i) / gw;
    if (out.some((o) => Math.abs(o.x / cell - (i + 0.5)) < minSep && Math.abs(o.y / cell - (j + 0.5)) < minSep)) continue;
    out.push({ x: (i + 0.5) * cell, y: (j + 0.5) * cell, depth: (d[k] / 3) * cell });
    if (out.length >= max) break;
  }
  return out;
}

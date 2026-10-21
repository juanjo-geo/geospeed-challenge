/**
 * Ubicación de las etiquetas del mapa tras responder (Tu respuesta · Ciudad correcta · rival ·
 * distancia · nombres de países) para que no se encimen entre sí, ni tapen los pines, ni queden bajo
 * la tarjeta de respuesta o los botones del mapa. Antes cada etiqueta tenía una posición fija (debajo
 * de tu pin, encima de la ciudad) y con respuestas cercanas quedaban una sobre otra.
 *
 * Todo en px del lienzo. Se calcula una vez por respuesta (no en cada cuadro de la animación).
 */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export const rectAround = (p: Pt, half: number): Rect => ({ x: p.x - half, y: p.y - half, w: half * 2, h: half * 2 });
const centered = (c: Pt, w: number, h: number): Rect => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });
const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });
/** Mueve el rectángulo lo justo para que quede dentro del área (si cabe) */
export function clampInto(r: Rect, area: Rect): Rect {
  const x = r.w >= area.w ? area.x + (area.w - r.w) / 2 : Math.min(Math.max(r.x, area.x), area.x + area.w - r.w);
  const y = r.h >= area.h ? area.y + (area.h - r.h) / 2 : Math.min(Math.max(r.y, area.y), area.y + area.h - r.h);
  return { x, y, w: r.w, h: r.h };
}

export function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}
const inside = (r: Rect, area: Rect) => r.x >= area.x && r.y >= area.y && r.x + r.w <= area.x + area.w && r.y + r.h <= area.y + area.h;

export interface PillRequest {
  key: string;
  w: number;
  h: number;
  /** Pin al que pertenece: la etiqueta se ubica a su alrededor */
  anchor: Pt;
  /** Radio del pin (px) */
  r: number;
  /** Otro punto del que conviene alejarse (el otro pin) */
  away?: Pt | null;
  /** Dirección preferida cuando no hay de qué alejarse: -1 arriba, 1 abajo */
  prefer?: -1 | 1;
  /** Centros candidatos propios en orden de preferencia (la distancia: sobre la curva) */
  spots?: Pt[];
  /** Penaliza poco tapar obstáculos blandos (la línea) */
  ignoreSoft?: boolean;
}

export interface PlacedPill { key: string; rect: Rect; anchor: Pt; r: number; leader: boolean }

const DIRS: [number, number][] = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1]];

function candidates(req: PillRequest): { rect: Rect; pref: number; leader: boolean }[] {
  if (req.spots) return req.spots.map((c, i) => ({ rect: centered(c, req.w, req.h), pref: i * 1.5, leader: false }));
  const { anchor: a, r, w, h } = req;
  let v: Pt | null = null;
  if (req.away) {
    const dx = a.x - req.away.x, dy = a.y - req.away.y;
    const len = Math.hypot(dx, dy);
    if (len > 4) v = { x: dx / len, y: dy / len };
  }
  if (!v) v = { x: 0, y: req.prefer ?? -1 };
  const out: { rect: Rect; pref: number; leader: boolean }[] = [];
  const gap = 5;
  for (let tier = 0; tier < 5; tier++) {
    const extra = tier * 26;
    DIRS.forEach(([dx, dy], i) => {
      const diag = dx !== 0 && dy !== 0;
      const cx = a.x + dx * (diag ? r * 0.7 + gap + extra * 0.7 + w / 2 : r + gap + extra + w / 2);
      const cy = a.y + dy * (diag ? r * 0.7 + gap + extra * 0.7 + h / 2 : r + gap + extra + h / 2);
      const len = Math.hypot(dx, dy);
      const dot = (dx / len) * v!.x + (dy / len) * v!.y;
      out.push({ rect: centered({ x: cx, y: cy }, w, h), pref: (1 - dot) * 3 + tier * 6 + i * 0.15, leader: tier > 0 });
    });
  }
  return out;
}

function placeInOrder(reqs: PillRequest[], hard: Rect[], soft: Rect[], area: Rect): { placed: PlacedPill[]; cost: number } {
  const placed: PlacedPill[] = [];
  const taken: Rect[] = [];
  let cost = 0;
  for (const req of reqs) {
    let best: { rect: Rect; leader: boolean } | null = null;
    let bestScore = Infinity;
    for (const c0 of candidates(req)) {
      // Nunca fuera del mapa visible: si la posición se sale, la etiqueta se corre hacia adentro (con
      // línea guía al pin si quedó separada de él). Antes solo se penalizaba y a veces quedaba cortada.
      const rect = clampInto(c0.rect, area);
      const moved = Math.abs(rect.x - c0.rect.x) + Math.abs(rect.y - c0.rect.y) > 2;
      const c = { rect, pref: c0.pref + (moved ? 2 : 0), leader: c0.leader || (moved && req.r > 0) };
      const A = c.rect.w * c.rect.h;
      let hardHit = 0;
      for (const o of hard) hardHit += overlapArea(c.rect, o);
      for (const o of taken) hardHit += overlapArea(c.rect, o);
      const out = A - overlapArea(c.rect, area);
      let softHit = 0;
      if (!req.ignoreSoft) for (const o of soft) softHit += overlapArea(c.rect, o);
      // Cualquier choque pesa más que alejarse del pin (con línea guía) o cambiar de lado
      const score = c.pref + (hardHit / A) * 400 + (out / A) * 400 + (softHit / A) * 12;
      if (score < bestScore) { bestScore = score; best = c; }
    }
    if (!best) continue;
    cost += bestScore;
    placed.push({ key: req.key, rect: best.rect, anchor: req.anchor, r: req.r, leader: best.leader });
    taken.push(pad(best.rect, 3));
  }
  return { placed, cost };
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/**
 * Ubica las etiquetas de pines probando cada orden posible (son 4 como máximo: 24 órdenes) y se queda
 * con la combinación que menos choca; ante empate gana el orden dado (la primera tiene prioridad).
 */
export function layoutPills(reqs: PillRequest[], hard: Rect[], soft: Rect[], area: Rect): PlacedPill[] {
  let best = placeInOrder(reqs, hard, soft, area);
  if (reqs.length < 2 || reqs.length > 5) return best.placed;
  for (const order of permutations(reqs).slice(1)) {
    const r = placeInOrder(order, hard, soft, area);
    if (r.cost < best.cost - 0.01) best = r;
  }
  return best.placed;
}

export interface TextRequest { key: string; w: number; h: number; spots: Pt[] }

/** Textos opcionales (nombres de países): cada uno en el primer punto libre de choques; si no hay, se omite. */
export function layoutTexts(items: TextRequest[], hard: Rect[], area: Rect): { key: string; x: number; y: number }[] {
  const out: { key: string; x: number; y: number }[] = [];
  const taken: Rect[] = [];
  for (const it of items) {
    for (const s of it.spots) {
      const r = centered(s, it.w, it.h);
      if (!inside(r, area)) continue;
      if (hard.some((o) => overlapArea(r, o) > 0) || taken.some((o) => overlapArea(r, o) > 0)) continue;
      out.push({ key: it.key, x: s.x, y: s.y });
      taken.push(pad(r, 4));
      break;
    }
  }
  return out;
}

/** Punto de un rectángulo más cercano a p (para la línea guía de una etiqueta alejada de su pin) */
export function nearestOnRect(r: Rect, p: Pt): Pt {
  return { x: Math.max(r.x, Math.min(p.x, r.x + r.w)), y: Math.max(r.y, Math.min(p.y, r.y + r.h)) };
}

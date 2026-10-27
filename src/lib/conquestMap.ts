/**
 * Conquista el mapa — piezas del tablero (fase C4): color y trama de cada jugador, las capas que pinta WorldMapCanvas,
 * los encuadres por zona y qué país se tocó. Solo lo importan las pantallas de Conquista (cargadas aparte): trae los
 * contornos de countries.ts a través de flagScoring.
 */
import { CONQ } from '@/lib/theme';
import { CONQUEST_COUNTRIES, type ConquestCountry } from '@/data/conquestCatalog';
import { FLAG_ITEMS } from '@/data/flagCatalog';
import { countryDistance } from '@/lib/flagScoring';
import type { MapBounds } from '@/data/cities';
import type { ConqMap, ConqPlayer, ConqTerritory } from '@/lib/conquest';
import type { TerritoryLayer } from '@/components/game/WorldMapCanvas';

export const conqCountry = (iso: string | null | undefined): ConquestCountry | undefined => CONQUEST_COUNTRIES.find((c) => c.iso === iso);
/** Nombre del país en el idioma del juego (el catálogo de Conquista trae los dos) */
export const conqCountryName = (iso: string | null | undefined, locale: string) => {
  const c = conqCountry(iso);
  return c ? (locale === 'en' ? c.nameEn : c.name) : iso ?? '';
};

/** Nombre del país en countries.ts (inglés) y un punto interior para la insignia, desde el catálogo de banderas */
const FLAG_BY_ISO = new Map(FLAG_ITEMS.map((f) => [f.iso, f]));
export function badgePoint(iso: string): { lat: number; lon: number } {
  const f = FLAG_BY_ISO.get(iso);
  if (f) return { lat: f.lat, lon: f.lon };
  const b = conqCountry(iso)?.bounds ?? [0, 0, 0, 0];
  return { lat: (b[1] + b[3]) / 2, lon: (b[0] + b[2]) / 2 };
}

// ── Jugadores: amarillo yo; rivales por orden de puesto con color, trama e inicial ──────────────────────────
export interface PlayerStyle extends ConqPlayer {
  me: boolean;
  color: string;
  pattern: 'stripes' | 'dots' | 'cross' | null;
  /** Inicial (dos letras si otro jugador empieza igual) */
  initial: string;
}
const firstLetters = (name: string | null, n: number) => {
  const clean = (name ?? '').replace(/[^\p{L}\p{N}]/gu, '');
  return clean ? clean.slice(0, n).charAt(0).toUpperCase() + clean.slice(1, n).toLowerCase() : '?';
};
export function playerStyles(players: ConqPlayer[], myId: string | null): Map<string, PlayerStyle> {
  const out = new Map<string, PlayerStyle>();
  let k = 0;
  for (const p of [...players].sort((a, b) => a.slot - b.slot)) {
    const me = p.user_id === myId;
    const clash = players.some((o) => o.user_id !== p.user_id && firstLetters(o.name, 1) === firstLetters(p.name, 1));
    const i = me ? -1 : k++;
    out.set(p.user_id, {
      ...p, me,
      color: me ? CONQ.me : CONQ.rivals[i % CONQ.rivals.length],
      pattern: me ? null : CONQ.rivalPatterns[i % CONQ.rivalPatterns.length],
      initial: firstLetters(p.name, clash ? 2 : 1),
    });
  }
  return out;
}

// ── Capas del mapa ───────────────────────────────────────────────────────────────────────────────────────────
/** Tablero: libres en pizarra, retirados en gris rayado, cada dueño con su color, trama e inicial */
export function boardLayer(territories: ConqTerritory[], styles: Map<string, PlayerStyle>, selected: string | null): TerritoryLayer {
  const fills: TerritoryLayer['fills'] = {};
  const badges: NonNullable<TerritoryLayer['badges']> = [];
  for (const t of territories) {
    const box = conqCountry(t.iso)?.bounds;
    const owner = t.owner_id ? styles.get(t.owner_id) : undefined;
    if (owner) {
      fills[t.iso] = { color: owner.color, pattern: owner.pattern, box };
      badges.push({ ...badgePoint(t.iso), text: owner.initial, color: owner.color });
    } else if (t.retired) {
      fills[t.iso] = { color: CONQ.retired, pattern: 'stripes', box };
    } else {
      fills[t.iso] = { color: CONQ.free, box };
    }
  }
  return { fills, badges, selected };
}
/** Misión y práctica: el país con su color normal y el resto apagado */
export const missionLayer = (iso: string): TerritoryLayer => ({ fills: { [iso]: { box: conqCountry(iso)?.bounds } } });
/** Ficha: solo ese país, con el color de su dueño (o libre) */
export function sheetLayer(t: ConqTerritory | null, iso: string, styles: Map<string, PlayerStyle>): TerritoryLayer {
  const box = conqCountry(iso)?.bounds;
  const owner = t?.owner_id ? styles.get(t.owner_id) : undefined;
  return { fills: { [iso]: owner ? { color: owner.color, pattern: owner.pattern, box } : t?.retired ? { color: CONQ.retired, pattern: 'stripes', box } : { color: CONQ.free, box } } };
}

/** Encuadre de un país (mapa de la misión y miniatura de la ficha) */
export function countryBounds(iso: string, margin = 0.04): MapBounds {
  const b = conqCountry(iso)?.bounds ?? [-180, -60, 180, 80];
  const mx = (b[2] - b[0]) * margin, my = (b[3] - b[1]) * margin;
  return { lonMin: b[0] - mx, latMin: b[1] - my, lonMax: b[2] + mx, latMax: b[3] + my };
}

// ── Zonas del tablero: los 10 países están en dos continentes ───────────────────────────────────────────────
export type BoardZone = 'america' | 'europe' | 'all';
export const EUROPE_ISOS = new Set(['ES', 'FR', 'IT']);
export const zoneOf = (iso: string): Exclude<BoardZone, 'all'> => (EUROPE_ISOS.has(iso) ? 'europe' : 'america');
function unionBounds(list: ConquestCountry[], m: number): MapBounds {
  return {
    lonMin: Math.min(...list.map((c) => c.bounds[0])) - m, latMin: Math.min(...list.map((c) => c.bounds[1])) - m,
    lonMax: Math.max(...list.map((c) => c.bounds[2])) + m, latMax: Math.max(...list.map((c) => c.bounds[3])) + m,
  };
}
export const ZONE_BOUNDS: Record<BoardZone, MapBounds> = {
  america: unionBounds(CONQUEST_COUNTRIES.filter((c) => !EUROPE_ISOS.has(c.iso)), 2),
  europe: unionBounds(CONQUEST_COUNTRIES.filter((c) => EUROPE_ISOS.has(c.iso)), 1.5),
  all: unionBounds(CONQUEST_COUNTRIES, 2),
};

/**
 * País del tablero que se tocó: el más cercano a menos de `maxKm` (dentro = 0 km), mirando solo los que tienen el toque
 * cerca de su caja (así un toque en la Guayana Francesa no elige Francia). Null en el mar lejos de todos. El tablero
 * pasa una tolerancia de unos 18 px según la escala del mapa (un dedo que cae al lado del país lo elige igual).
 */
const NAME_BY_ISO = new Map(FLAG_ITEMS.map((f) => [f.iso, f.name]));
export function pickTerritory(lat: number, lon: number, maxKm = 120): string | null {
  let best: string | null = null;
  let bestKm = Infinity;
  for (const c of CONQUEST_COUNTRIES) {
    const b = c.bounds;
    if (lon < b[0] - 3 || lon > b[2] + 3 || lat < b[1] - 3 || lat > b[3] + 3) continue;
    const name = NAME_BY_ISO.get(c.iso);
    const hit = name ? countryDistance(name, lat, lon) : null;
    if (hit && hit.km < bestKm) { bestKm = hit.km; best = c.iso; }
  }
  return bestKm <= maxKm ? best : null;
}

/** Mi resumen en el tablero: territorios y puesto (empates comparten puesto) */
export function myStanding(map: ConqMap): { territories: number; rank: number; total: number } | null {
  const s = map.standings.find((x) => x.user_id === map.my_id);
  return s ? { territories: s.territories, rank: s.rank, total: map.standings.length } : null;
}

/**
 * Catálogo de banderas (Fase 6) a partir de src/data/countries.ts (contornos 1:110m), src/data/flagTiers.ts
 * (qué países entran y su nivel), src/lib/mapContinents.ts (región) y src/lib/flags.ts (código ISO).
 *
 * Escribe:
 *  1) src/data/flagCatalog.ts — un ítem por país, con la forma de `City` (kind 'flag', id `flag:<ISO>`,
 *     lat/lon = un punto interior del contorno más grande, para el pin y la pista).
 *  2) supabase/seed/flag_places.sql — los mismos lugares en `places` (kind 'flag') y sus contornos en
 *     `place_shapes`, con los que el servidor mide la distancia del clic al país (shape_distance_km).
 *
 * Uso: node scripts/build-flags.mjs  (y luego incluir el seed en la migración correspondiente)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const read = (f) => readFileSync(f, 'utf8');

// ── Entradas ────────────────────────────────────────────────────────────────
const cs = read('src/data/countries.ts');
const countries = JSON.parse(cs.slice(cs.indexOf('= [') + 2, cs.lastIndexOf('];') + 1));
const byName = new Map(countries.map((c) => [c.name, c]));

const tiersSrc = read('src/data/flagTiers.ts');
const tiers = new Map();
for (const m of tiersSrc.matchAll(/(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"):\s*'(basic|easy|medium|hard)'/g)) {
  tiers.set((m[1] ?? m[2]).replace(/\\'/g, "'"), m[3]);
}

const contSrc = read('src/lib/mapContinents.ts');
const regionOf = new Map();
const REGION = { Europe: 'europe', Asia: 'asia', Africa: 'africa', Americas: 'americas', Oceania: null };
for (const m of contSrc.matchAll(/(\w+): new Set\(\[([^\]]*)\]\)/g)) {
  if (!(m[1] in REGION)) continue;
  for (const name of Function(`return [${m[2]}]`)()) regionOf.set(name, REGION[m[1]]);
}

const flagsSrc = read('src/lib/flags.ts');
const iso = new Map();
for (const m of flagsSrc.matchAll(/(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"):\s*'([A-Z]{2})'/g)) {
  const name = (m[1] ?? m[2]).replace(/\\'/g, "'");
  if (!iso.has(name)) iso.set(name, m[3]);
}

// ── Geometría: punto interior del anillo más grande ─────────────────────────
function ringArea(ring) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n]; a += x1 * y2 - x2 * y1; }
  return a / 2;
}
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function innerPoint(ring) {
  const a = ringArea(ring);
  let cx, cy;
  if (Math.abs(a) < 1e-9) {
    cx = ring.reduce((s, p) => s + p[0], 0) / ring.length; cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  } else {
    cx = 0; cy = 0;
    for (let i = 0, n = ring.length; i < n; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n]; const f = x1 * y2 - x2 * y1; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
    cx /= 6 * a; cy /= 6 * a;
  }
  if (pointInRing(cx, cy, ring)) return [cx, cy];
  // Centroide fuera (formas cóncavas): el punto medio del tramo interior más largo a esa latitud
  const xs = [];
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n];
    if (y1 > cy !== y2 > cy) xs.push(x1 + ((cy - y1) * (x2 - x1)) / (y2 - y1));
  }
  xs.sort((p, q) => p - q);
  let best = null;
  for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
  return best ? [(best[0] + best[1]) / 2, cy] : [cx, cy];
}

// ── Catálogo ────────────────────────────────────────────────────────────────
const items = [];
const problems = [];
for (const [name, difficulty] of tiers) {
  const c = byName.get(name);
  if (!c) { problems.push(`sin contorno: ${name}`); continue; }
  const code = iso.get(name);
  if (!code) { problems.push(`sin ISO: ${name}`); continue; }
  const biggest = c.polygons.reduce((b, r) => (Math.abs(ringArea(r)) > Math.abs(ringArea(b)) ? r : b), c.polygons[0]);
  const [lon, lat] = innerPoint(biggest);
  const region = regionOf.get(name) ?? null;
  if (region === undefined) problems.push(`sin región: ${name}`);
  items.push({ id: `flag:${code}`, iso: code, name, lat: +lat.toFixed(2), lon: +lon.toFixed(2), difficulty, region, polygons: c.polygons });
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
items.sort((a, b) => a.name.localeCompare(b.name));

const q = (s) => `'${s.replace(/'/g, "\\'")}'`;
const ts = `// Generado por scripts/build-flags.mjs a partir de countries.ts + flagTiers.ts. No editar a mano.
import type { City } from './cities';

/** Banderas (Fase 6): un ítem por país del mapa, con la forma de City (kind 'flag'). lat/lon = punto interior. */
export const FLAG_ITEMS: City[] = [
${items.map((f) => `  { id: '${f.id}', kind: 'flag', iso: '${f.iso}', name: ${q(f.name)}, country: ${q(f.name)}, lat: ${f.lat}, lon: ${f.lon}, difficulty: '${f.difficulty}', region: ${f.region ? `'${f.region}'` : 'null'} },`).join('\n')}
];
`;
writeFileSync('src/data/flagCatalog.ts', ts);

const esc = (s) => s.replace(/'/g, "''");
const placeRows = items.map((f) => `  ('${f.id}', 'flag', '${esc(f.name)}', '${esc(f.name)}', ${f.lat}, ${f.lon})`);
const shapeRows = [];
for (const f of items) {
  f.polygons.forEach((ring, i) => {
    if (ring.length < 3) return;
    shapeRows.push(`  ('${f.id}', ${i}, array[${ring.map((p) => p[0]).join(',')}]::double precision[], array[${ring.map((p) => p[1]).join(',')}]::double precision[])`);
  });
}
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/flag_places.sql', `-- Generado por scripts/build-flags.mjs (banderas, Fase 6). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${placeRows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where place_id like 'flag:%';
insert into public.place_shapes (place_id, ring_no, lons, lats) values
${shapeRows.join(',\n')};
`);

const perTier = {};
for (const f of items) perTier[f.difficulty] = (perTier[f.difficulty] ?? 0) + 1;
const perRegion = {};
for (const f of items) perRegion[f.region ?? 'oceania'] = (perRegion[f.region ?? 'oceania'] ?? 0) + 1;
console.log(`banderas ${items.length}`, perTier, perRegion, `anillos ${shapeRows.length}`);

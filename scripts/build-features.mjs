/**
 * Catálogo de lugares geográficos (Fase 6b) a partir de src/data/featureTiers.ts (qué lugares entran, nombre
 * ES/EN, tipo, nivel y dónde está su geometría) y los GeoJSON de Natural Earth (dominio público):
 *   ne_50m_rivers_lake_centerlines · ne_10m_rivers_lake_centerlines · ne_50m_lakes · ne_10m_lakes ·
 *   ne_10m_geography_marine_polys · ne_10m_geography_regions_polys · ne_10m_geography_regions_points
 *   (https://github.com/nvkelso/natural-earth-vector/tree/master/geojson — no se guardan en el repo, ~25 MB).
 * Las penínsulas que Natural Earth no trae se arman con los contornos de src/data/countries.ts.
 *
 * Escribe:
 *  1) src/data/featureCatalog.ts — un ítem por lugar con la forma de `City` (kind 'feature', id `feat:<slug>`,
 *     ftype, geom área/línea/punto, lat/lon = punto representativo, países que toca en ISO, región).
 *  2) src/data/featureShapes.json — contornos simplificados (áreas y líneas) para dibujarlos y medir en el
 *     teléfono (src/lib/featureScoring.ts); se carga aparte, solo cuando se juega con lugares.
 *  3) supabase/seed/feature_places.sql — los mismos lugares en `places` (kind 'feature') y sus contornos en
 *     `place_shapes` (is_line para los ríos), con los que el servidor recalcula cada ronda (shape_distance_km).
 *  4) docs/Fase6_Lugares_catalogo.md — listado por región y nivel para revisión.
 *
 * Uso: node scripts/build-features.mjs --ne <carpeta con los .geojson>   (y luego incluir el seed en la migración)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const argi = process.argv.indexOf('--ne');
const NE = argi > 0 ? process.argv[argi + 1] : process.env.NE_DIR;
if (!NE || !existsSync(NE)) { console.error('Falta --ne <carpeta con los GeoJSON de Natural Earth>'); process.exit(1); }
const read = (f) => readFileSync(f, 'utf8');

// ── Especificación (TS → JS con esbuild) ─────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-features-'));
await build({ entryPoints: ['src/data/featureTiers.ts'], bundle: true, format: 'esm', outdir: tmp, alias: { '@': resolve('src') }, logLevel: 'warning' });
const { FEATURES } = await import(pathToFileURL(join(tmp, 'featureTiers.js')).href);

// ── Natural Earth ────────────────────────────────────────────────────────────
const FILES = {
  rivers: 'ne_50m_rivers_lake_centerlines', rivers10: 'ne_10m_rivers_lake_centerlines',
  lakes: 'ne_50m_lakes', lakes10: 'ne_10m_lakes',
  marine: 'ne_10m_geography_marine_polys', regions: 'ne_10m_geography_regions_polys', points: 'ne_10m_geography_regions_points',
};
// Tolerancias de simplificación (grados): el JSON del teléfono y el seed del servidor comparten estos contornos
const TOL = { rivers: 0.05, rivers10: 0.05, lakes: 0.02, lakes10: 0.015, marine: 0.08, regions: 0.08, points: 0, countries: 0 };
const cache = new Map();
const dataset = (key) => {
  if (!cache.has(key)) cache.set(key, JSON.parse(read(join(NE, `${FILES[key]}.geojson`))).features);
  return cache.get(key);
};
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const featName = (p) => [p.name, p.NAME, p.name_en, p.NAME_EN].filter(Boolean).map(norm);
const inBBox = (coords, [x0, y0, x1, y1]) => {
  let hit = false;
  walk(coords, ([x, y]) => { if (x >= x0 && x <= x1 && y >= y0 && y <= y1) hit = true; });
  return hit;
};
function walk(coords, fn) {
  if (typeof coords[0] === 'number') { fn(coords); return; }
  for (const c of coords) walk(c, fn);
}

// ── countries.ts: contornos, continente, ISO ─────────────────────────────────
const cs = read('src/data/countries.ts');
const countries = JSON.parse(cs.slice(cs.indexOf('= [') + 2, cs.lastIndexOf('];') + 1));
for (const c of countries) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of c.polygons) for (const [x, y] of ring) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  c.bbox = [x0, y0, x1, y1];
}
const REGION = { Europe: 'europe', Asia: 'asia', Africa: 'africa', Americas: 'americas', Oceania: null };
const regionOf = new Map();
for (const m of read('src/lib/mapContinents.ts').matchAll(/(\w+): new Set\(\[([^\]]*)\]\)/g)) {
  if (!(m[1] in REGION)) continue;
  for (const name of Function(`return [${m[2]}]`)()) regionOf.set(name, REGION[m[1]]);
}
const iso = new Map();
for (const m of read('src/lib/flags.ts').matchAll(/(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"):\s*'([A-Z]{2})'/g)) {
  const name = (m[1] ?? m[2]).replace(/\\'/g, "'");
  if (!iso.has(name)) iso.set(name, m[3]);
}

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
function countryAt(lon, lat) {
  for (const c of countries) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    for (const ring of c.polygons) if (ring.length >= 3 && pointInRing(lon, lat, ring)) return c;
  }
  return null;
}
function nearestCountry(lon, lat, maxDeg) {
  let best = null, bd = maxDeg * maxDeg;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const c of countries) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lon < x0 - maxDeg || lon > x1 + maxDeg || lat < y0 - maxDeg || lat > y1 + maxDeg) continue;
    for (const ring of c.polygons) for (const [x, y] of ring) {
      const dx = (x - lon) * k, dy = y - lat, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = c; }
    }
  }
  return best;
}

// ── Geometría ────────────────────────────────────────────────────────────────
function simplify(pts, tol) {
  if (tol <= 0 || pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (l2 === 0) d = Math.hypot(px - ax, py - ay);
      else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)); d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r3 = (v) => Math.round(v * 1000) / 1000;
function clean(pts, closed) {
  const out = [];
  for (const [x, y] of pts) {
    const p = [r3(x), r3(y)];
    if (out.length && out[out.length - 1][0] === p[0] && out[out.length - 1][1] === p[1]) continue;
    out.push(p);
  }
  if (closed && out.length >= 3 && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) out.push([...out[0]]);
  return out;
}
function innerPoint(ring) {
  const a = ringArea(ring);
  let cx, cy;
  if (Math.abs(a) < 1e-9) { cx = ring.reduce((s, p) => s + p[0], 0) / ring.length; cy = ring.reduce((s, p) => s + p[1], 0) / ring.length; }
  else {
    cx = 0; cy = 0;
    for (let i = 0, n = ring.length; i < n; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n]; const f = x1 * y2 - x2 * y1; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
    cx /= 6 * a; cy /= 6 * a;
  }
  if (pointInRing(cx, cy, ring)) return [cx, cy];
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
const lineLen = (l) => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], (l[i][1] - l[i - 1][1])); return s; };
function lineMidpoint(lines) {
  const l = lines.reduce((b, x) => (lineLen(x) > lineLen(b) ? x : b), lines[0]);
  const half = lineLen(l) / 2;
  let s = 0;
  for (let i = 1; i < l.length; i++) { s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); if (s >= half) return l[i]; }
  return l[Math.floor(l.length / 2)];
}

/** Geometría de una entrada: { rings, lines } (una de las dos) o { point } */
function resolve_(spec) {
  const ne = spec.ne;
  if (ne?.ds === 'countries') {
    const rings = [];
    for (const name of [].concat(ne.name)) {
      const c = countries.find((x) => x.name === name);
      if (!c) return { error: `país sin contorno: ${name}` };
      rings.push(c.polygons.reduce((b, r) => (Math.abs(ringArea(r)) > Math.abs(ringArea(b)) ? r : b), c.polygons[0]));
    }
    return { rings: rings.map((r) => clean(r, true)) };
  }
  if (ne) {
    const names = [].concat(ne.name).map(norm);
    let found = dataset(ne.ds).filter((ft) => featName(ft.properties).some((n) => names.includes(n)));
    if (ne.bbox) found = found.filter((ft) => inBBox(ft.geometry.coordinates, ne.bbox));
    if (found.length) {
      if (ne.ds === 'points') {
        const [lon, lat] = found[0].geometry.coordinates;
        return { point: [lat, lon] };
      }
      const rings = [], lines = [];
      for (const ft of found) {
        const g = ft.geometry;
        if (g.type === 'Polygon') rings.push(g.coordinates[0]);
        else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) rings.push(poly[0]);
        else if (g.type === 'LineString') lines.push(g.coordinates);
        else if (g.type === 'MultiLineString') for (const l of g.coordinates) lines.push(l);
      }
      const tol = TOL[ne.ds];
      if (rings.length) {
        let rs = rings.map((r) => clean(simplify(r, tol), true)).filter((r) => r.length >= 4);
        // Polígonos muy chicos: la simplificación los deja en nada → sin simplificar, o el punto a mano
        if (!rs.length) rs = rings.map((r) => clean(r, true)).filter((r) => r.length >= 4);
        if (!rs.length) return spec.point ? { point: spec.point } : { error: `polígono degenerado (${[].concat(ne.name).join(' / ')})` };
        rs.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
        const big = Math.abs(ringArea(rs[0]));
        rs = rs.filter((r, i) => i === 0 || Math.abs(ringArea(r)) >= Math.max(0.002, big * 0.01)).slice(0, 12);
        return { rings: rs };
      }
      if (lines.length) {
        let ls = lines.map((l) => clean(simplify(l, tol), false)).filter((l) => l.length >= 2);
        const longest = Math.max(...ls.map(lineLen));
        ls = ls.filter((l) => longest < 2 || lineLen(l) >= 0.1);
        return { lines: ls };
      }
    }
    if (!spec.point) return { error: `sin geometría en Natural Earth (${ne.ds}: ${[].concat(ne.name).join(' / ')})` };
    console.warn(`aviso: ${spec.id} no está en Natural Earth (${ne.ds}); se usa el punto a mano`);
  }
  if (spec.point) return { point: spec.point };
  return { error: 'sin geometría ni punto' };
}

// ── Catálogo ─────────────────────────────────────────────────────────────────
const items = [];
const problems = [];
const seen = new Set();
for (const spec of FEATURES) {
  if (seen.has(spec.id)) problems.push(`id repetido: ${spec.id}`);
  seen.add(spec.id);
  const g = resolve_(spec);
  if (g.error) { problems.push(`${spec.id}: ${g.error}`); continue; }
  let lat, lon, geom;
  if (g.point) { [lat, lon] = g.point; geom = 'point'; }
  else if (g.rings) { [lon, lat] = innerPoint(g.rings[0]); geom = 'area'; }
  else { [lon, lat] = lineMidpoint(g.lines); geom = 'line'; }
  // Países que toca (para la pista): muestreo de vértices; en el mar, el país más cercano a cada vértice
  const counts = new Map();
  const vertices = g.point ? [[lon, lat]] : (g.rings ?? g.lines).flat();
  const step = Math.max(1, Math.floor(vertices.length / 250));
  for (let i = 0; i < vertices.length; i += step) {
    const [x, y] = vertices[i];
    const c = countryAt(x, y) ?? nearestCountry(x, y, geom === 'point' ? 1.5 : 0.6);
    if (c) counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
  }
  const touched = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const isos = touched.map((n) => iso.get(n)).filter(Boolean).slice(0, 5);
  let region = spec.region;
  if (region === undefined) {
    const c = countryAt(lon, lat) ?? nearestCountry(lon, lat, 4);
    region = c ? (regionOf.get(c.name) ?? null) : null;
    if (!c) problems.push(`${spec.id}: sin región (no hay país cerca de ${lat.toFixed(2)}, ${lon.toFixed(2)}); poner region en la spec`);
  }
  items.push({ id: `feat:${spec.id}`, spec, lat: +lat.toFixed(3), lon: +lon.toFixed(3), geom, region, isos, rings: g.rings, lines: g.lines });
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// ── Salidas ──────────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const ts = `// Generado por scripts/build-features.mjs a partir de featureTiers.ts + Natural Earth. No editar a mano.
import type { City } from './cities';

/** Lugares geográficos (Fase 6b): un ítem por accidente, con la forma de City (kind 'feature'). lat/lon = punto representativo. */
export const FEATURE_ITEMS: City[] = [
${items.map((it) => `  { id: '${it.id}', kind: 'feature', ftype: '${it.spec.type}', geom: '${it.geom}', name: ${q(it.spec.es)}, nameEn: ${q(it.spec.en)}, country: '', lat: ${it.lat}, lon: ${it.lon}, difficulty: '${it.spec.tier}', region: ${it.region ? `'${it.region}'` : 'null'}, isos: [${it.isos.map((c) => `'${c}'`).join(', ')}] },`).join('\n')}
];
`;
writeFileSync('src/data/featureCatalog.ts', ts);

const shapes = {};
for (const it of items) if (it.geom !== 'point') shapes[it.id] = { line: it.geom === 'line', rings: it.rings ?? it.lines };
const shapesJson = JSON.stringify(shapes);
writeFileSync('src/data/featureShapes.json', shapesJson);

const esc = (s) => String(s).replace(/'/g, "''");
const placeRows = items.map((it) => `  ('${it.id}', 'feature', '${esc(it.spec.es)}', null, ${it.lat}, ${it.lon})`);
const shapeRows = [];
for (const it of items) {
  (it.rings ?? it.lines ?? []).forEach((ring, i) => {
    shapeRows.push(`  ('${it.id}', ${i}, array[${ring.map((p) => p[0]).join(',')}]::double precision[], array[${ring.map((p) => p[1]).join(',')}]::double precision[], ${it.geom === 'line'})`);
  });
}
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/feature_places.sql', `-- Generado por scripts/build-features.mjs (lugares geográficos, Fase 6b). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${placeRows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where place_id like 'feat:%';
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
${shapeRows.join(',\n')};
`);

// ── Documento de revisión ────────────────────────────────────────────────────
const TIER = { basic: 'Turista', easy: 'Rookie', medium: 'Crack', hard: 'Leyenda' };
const TIERS = ['basic', 'easy', 'medium', 'hard'];
const REG = { americas: 'América', europe: 'Europa', asia: 'Asia', africa: 'África', oceania: 'Oceanía (solo en Mundo)' };
const TYPE_ES = { river: 'río', lake: 'lago', sea: 'mar', gulf: 'golfo', strait: 'estrecho', range: 'cordillera', peak: 'pico', volcano: 'volcán', desert: 'desierto', island: 'isla', islands: 'archipiélago', peninsula: 'península', cape: 'cabo', plateau: 'meseta', basin: 'cuenca', delta: 'delta', waterfall: 'cataratas', valley: 'valle', plain: 'llanura', wetland: 'humedal', canyon: 'cañón', region: 'región', reef: 'arrecife', isthmus: 'istmo', glacier: 'glaciar' };
const GEOM_ES = { area: 'área', line: 'línea', point: 'punto' };
const regKey = (it) => it.region ?? 'oceania';
let doc = `# Fase 6b · Lugares geográficos — catálogo para revisión

Borrador (2026-10-22), ${items.length} lugares con su nivel. Para cambiar algo: editar \`src/data/featureTiers.ts\` y correr
\`node scripts/build-features.mjs --ne <carpeta Natural Earth>\` (regenera \`src/data/featureCatalog.ts\`, \`src/data/featureShapes.json\`
y \`supabase/seed/feature_places.sql\`; si cambian lugares, volver a aplicar la parte de seed en el SQL Editor).

Niveles por lo conocido que es el lugar para un jugador latinoamericano: **Turista** · **Rookie** · **Crack** · **Leyenda**.
En las regiones, si un nivel no llega a 13 lugares se completa con el nivel vecino. Entre paréntesis, cómo se mide:
**área** (tocar dentro vale cercanía perfecta; fuera, la distancia al borde), **línea** (distancia al punto más cercano del trazo:
ríos, estrechos) o **punto** (distancia al punto: picos, volcanes, cabos, cataratas).

| Región | Turista | Rookie | Crack | Leyenda | Total |
|---|---|---|---|---|---|
`;
for (const r of Object.keys(REG)) {
  const c = items.filter((it) => regKey(it) === r);
  doc += `| ${REG[r]} | ${TIERS.map((t) => c.filter((it) => it.spec.tier === t).length).join(' | ')} | ${c.length} |\n`;
}
doc += `| **Total** | ${TIERS.map((t) => items.filter((it) => it.spec.tier === t).length).join(' | ')} | ${items.length} |\n\n`;
for (const r of Object.keys(REG)) {
  doc += `## ${REG[r]}\n\n`;
  for (const t of TIERS) {
    const c = items.filter((it) => regKey(it) === r && it.spec.tier === t).map((it) => `${it.spec.es} (${TYPE_ES[it.spec.type]}, ${GEOM_ES[it.geom]})`).sort((a, b) => a.localeCompare(b, 'es'));
    if (c.length) doc += `- **${TIER[t]}** (${c.length}): ${c.join(' · ')}\n`;
  }
  doc += '\n';
}
doc += `## Fuera del catálogo

- Países-isla (Madagascar, Cuba, Islandia, Sri Lanka…): ya están en Banderas.
- La Antártida y sus mares: el mapa termina en 62° S.
- Lugares que Natural Earth no trae con contorno (Mojave, Everglades, Valle de la Muerte, Sinaí, Azores, Madeira, Ormuz) entran como punto.

## Cómo se puntúa (decisión del 22-10-2026, igual que Banderas)

Dentro de un área vale la cercanía perfecta (1.000); fuera, o en un río, cuenta la distancia al borde o al trazo más cercano,
con la misma curva (1.500 km en Mundo, 600 km en una región), más rapidez y combo. El servidor recalcula cada ronda con los
mismos contornos (prueba de paridad: \`npm run test:features-sql\`).
`;
writeFileSync('docs/Fase6_Lugares_catalogo.md', doc);

// ── Resumen ──────────────────────────────────────────────────────────────────
const count = (fn) => items.reduce((m, it) => { const k = fn(it); m[k] = (m[k] ?? 0) + 1; return m; }, {});
const pts = Object.values(shapes).reduce((s, sh) => s + sh.rings.reduce((t, r) => t + r.length, 0), 0);
console.log(`lugares ${items.length}`, count((it) => it.spec.tier), count(regKey), count((it) => it.geom));
console.log(`contornos ${shapeRows.length} (${pts} puntos, ${(shapesJson.length / 1024).toFixed(0)} KB json)`);

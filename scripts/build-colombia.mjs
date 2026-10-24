/**
 * Pack Colombia (Fase 7a) a partir de src/data/colombiaTiers.ts:
 *  · departamentos: contornos de Natural Earth admin-1 1:10m (dominio público; ne_10m_admin_1_states_provinces.geojson
 *    de github.com/nvkelso/natural-earth-vector, ~40 MB, no va al repo), simplificados; las fronteras internas se sacan
 *    de los lados compartidos ANTES de simplificar (cada frontera se dibuja una vez y no queda doble) y de ahí salen
 *    también los vecinos de cada departamento (pista) y un tono por departamento (coloreo de 4 colores, para el mapa).
 *  · municipios: coordenadas de Wikidata (CC0) si el resultado es de Colombia y queda a ≤ 25 km del punto escrito en la
 *    spec; si no, las de la spec. Las respuestas de la API se guardan en <out>/cache.
 *
 * Escribe src/data/colombiaCatalog.ts, src/data/packShapes.json, supabase/seed/colombia_places.sql y
 * docs/Fase7_Colombia_catalogo.md.
 *
 * Uso: node scripts/build-colombia.mjs --ne <carpeta con los GeoJSON> --out <carpeta de trabajo>
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const NE = arg('--ne'), OUT = arg('--out');
if (!NE || !OUT) { console.error('Uso: node scripts/build-colombia.mjs --ne <carpeta> --out <carpeta>'); process.exit(1); }
mkdirSync(join(OUT, 'cache'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');

const tmp = mkdtempSync(join(tmpdir(), 'geospeed-colombia-'));
await build({ entryPoints: ['src/data/colombiaTiers.ts'], bundle: true, format: 'esm', outdir: tmp, alias: { '@': resolve('src') }, logLevel: 'warning' });
const { DEPARTMENTS, MUNICIPIOS } = await import(pathToFileURL(join(tmp, 'colombiaTiers.js')).href);

// ── Geometría ────────────────────────────────────────────────────────────────
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
  let cx = 0, cy = 0;
  for (let i = 0, n = ring.length; i < n; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n]; const f = x1 * y2 - x2 * y1; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
  cx /= 6 * a; cy /= 6 * a;
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
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
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
      let dd;
      if (l2 === 0) dd = Math.hypot(px - ax, py - ay);
      else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)); dd = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); }
      if (dd > maxD) { maxD = dd; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r4 = (v) => Math.round(v * 10000) / 10000;
function clean(pts, closed) {
  const out = [];
  for (const [x, y] of pts) {
    const p = [r4(x), r4(y)];
    if (out.length && out[out.length - 1][0] === p[0] && out[out.length - 1][1] === p[1]) continue;
    out.push(p);
  }
  if (closed && out.length >= 3 && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) out.push([...out[0]]);
  return out;
}
const haversine = (a, b, c, dd) => { const r = Math.PI / 180, dLat = (c - a) * r, dLon = (dd - b) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLon / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };

// ── Departamentos (Natural Earth) ────────────────────────────────────────────
const TOL = 0.012;
const admin1 = JSON.parse(read(join(NE, 'ne_10m_admin_1_states_provinces.geojson'))).features.filter((f) => f.properties.adm0_a3 === 'COL' && f.properties.name);
const problems = [];
const depts = [];
for (const spec of DEPARTMENTS) {
  const ft = admin1.find((f) => f.properties.name === spec.ne);
  if (!ft) { problems.push(`departamento sin contorno en Natural Earth: ${spec.ne}`); continue; }
  const g = ft.geometry;
  const raw = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]);
  depts.push({ spec, raw });
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// Lados compartidos (sin simplificar): frontera interna y vecinos
const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
const edgeOwners = new Map();
for (const dp of depts) {
  for (const ring of dp.raw) {
    for (let i = 0; i + 1 < ring.length; i++) {
      const a = key(ring[i]), b = key(ring[i + 1]);
      if (a === b) continue;
      const k = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edgeOwners.has(k)) edgeOwners.set(k, new Set());
      edgeOwners.get(k).add(dp.spec.id);
    }
  }
}
const neighbors = new Map(depts.map((dp) => [dp.spec.id, new Set()]));
const internal = [];
for (const [k, owners] of edgeOwners) {
  if (owners.size < 2) continue;
  const [a, b] = [...owners];
  neighbors.get(a).add(b); neighbors.get(b).add(a);
  internal.push(k.split('|'));
}
// Encadenar los lados internos en polilíneas
const adj = new Map();
for (const [a, b] of internal) {
  if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []);
  adj.get(a).push(b); adj.get(b).push(a);
}
const used = new Set();
const ek = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const toPt = (s) => s.split(',').map(Number);
const chains = [];
const starts = [...adj.keys()].sort((p, q) => (adj.get(p).length !== 2 ? 0 : 1) - (adj.get(q).length !== 2 ? 0 : 1));
for (const s of starts) {
  for (const n0 of adj.get(s)) {
    if (used.has(ek(s, n0))) continue;
    const chain = [s];
    let prev = s, cur = n0;
    used.add(ek(prev, cur));
    for (;;) {
      chain.push(cur);
      if (adj.get(cur).length !== 2) break;
      const next = adj.get(cur).find((n) => !used.has(ek(cur, n)));
      if (!next) break;
      used.add(ek(cur, next));
      prev = cur; cur = next;
    }
    chains.push(chain.map(toPt));
  }
}
const borders = chains.map((c) => clean(simplify(c, TOL), false)).filter((c) => c.length >= 2);

// Coloreo de 4 tonos (vecinos con tono distinto), del más conectado al menos
const tone = new Map();
for (const id of [...neighbors.keys()].sort((a, b) => neighbors.get(b).size - neighbors.get(a).size)) {
  const taken = new Set([...neighbors.get(id)].map((n) => tone.get(n)).filter((t) => t !== undefined));
  let t = 0; while (taken.has(t)) t++;
  tone.set(id, t % 4);
}

const name = new Map(DEPARTMENTS.map((s) => [s.id, s.es]));
const muniById = new Map(MUNICIPIOS.map((mm) => [mm.id, mm]));
for (const dp of depts) {
  let rings = dp.raw.map((r) => clean(simplify(r, TOL), true)).filter((r) => r.length >= 4);
  rings.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
  if (dp.spec.id !== 'san-andres') rings = rings.filter((r, i) => i === 0 || Math.abs(ringArea(r)) >= 0.0008);
  dp.rings = rings;
  const [lon, lat] = innerPoint(rings[0]);
  dp.lat = +lat.toFixed(3); dp.lon = +lon.toFixed(3);
  if (!muniById.has(dp.spec.capital)) problems.push(`${dp.spec.id}: capital desconocida ${dp.spec.capital}`);
}

// ── Municipios (Wikidata) ────────────────────────────────────────────────────
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, cacheKey) {
  const f = join(OUT, 'cache', cacheKey.replace(/[^a-z0-9_-]/gi, '_') + '.json');
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(120); return j; }
    if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`sin respuesta: ${url}`);
}
const WD = 'https://www.wikidata.org/w/api.php';
const claimsOf = (ent, p) => (ent?.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
async function refine(mm) {
  for (const q of [mm.name, `${mm.name} Colombia`]) {
    const s = await getJson(`${WD}?action=wbsearchentities&search=${encodeURIComponent(q)}&language=es&uselang=es&type=item&limit=10&format=json`, `co_search_${q}`);
    const ids = (s.search ?? []).map((x) => x.id);
    if (!ids.length) continue;
    const e = await getJson(`${WD}?action=wbgetentities&ids=${ids.join('|')}&props=claims&format=json`, `co_ent_${ids.join('_')}`);
    let best = null;
    for (const id of ids) {
      const ent = e.entities?.[id];
      if (!claimsOf(ent, 'P17').some((v) => v.id === 'Q739')) continue;
      const c = claimsOf(ent, 'P625')[0];
      if (!c) continue;
      const km = haversine(c.latitude, c.longitude, mm.lat, mm.lon);
      if (km <= 25 && (!best || km < best.km)) best = { id, km, lat: c.latitude, lon: c.longitude };
    }
    if (best) return best;
  }
  return null;
}
const munis = [];
let refined = 0;
for (const mm of MUNICIPIOS) {
  if (!name.has(mm.dept)) problems.push(`${mm.id}: departamento desconocido ${mm.dept}`);
  // Wikidata confirma el municipio; si su punto queda a más de 5 km del escrito (centro del distrito, no de la
  // ciudad: pasaba con Bogotá y Cartagena) se queda el de la spec, que es el centro urbano
  const found = await refine(mm);
  const r = found && found.km <= 5 ? found : null;
  if (r) refined++;
  munis.push({ ...mm, lat: r ? +r.lat.toFixed(4) : mm.lat, lon: r ? +r.lon.toFixed(4) : mm.lon, wikidata: r?.id ?? null, moved: r ? +r.km.toFixed(1) : null });
  process.stdout.write(r ? '·' : '?');
}
console.log();
const seen = new Set();
for (const mm of MUNICIPIOS) { if (seen.has(mm.id)) problems.push(`municipio repetido: ${mm.id}`); seen.add(mm.id); }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// ── Salidas ──────────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const capitals = new Map(DEPARTMENTS.map((s) => [s.capital, s.id]));
const ts = `// Generado por scripts/build-colombia.mjs a partir de colombiaTiers.ts + Natural Earth + Wikidata. No editar a mano.
import type { City } from './cities';

/** Pack Colombia (Fase 7a): municipios (se miden al punto, como las ciudades). admin = departamento. */
export const COLOMBIA_CITIES: City[] = [
${munis.map((mm) => `  { id: 'co:${mm.id}', name: ${q(mm.name)}, country: 'Colombia', admin: ${q(name.get(mm.dept))}, ${capitals.has(mm.id) || mm.id === 'bogota' ? 'isCapital: true, ' : ''}lat: ${mm.lat}, lon: ${mm.lon}, difficulty: '${mm.tier}', region: 'colombia' },`).join('\n')}
];

/** Pack Colombia: departamentos (área, contorno en packShapes.json). lat/lon = punto interior; nb = vecinos. */
export const COLOMBIA_DIVISIONS: City[] = [
${depts.map((dp) => `  { id: 'div:co-${dp.spec.id}', kind: 'division', geom: 'area', ftype: '${dp.spec.district ? 'district' : 'department'}', name: ${q(dp.spec.es)}, nameEn: ${q(dp.spec.en)}, country: 'Colombia', capital: ${q(muniById.get(dp.spec.capital).name)}, nb: [${[...neighbors.get(dp.spec.id)].map((n) => q(name.get(n))).sort().join(', ')}], lat: ${dp.lat}, lon: ${dp.lon}, difficulty: '${dp.spec.tier}', region: 'colombia' },`).join('\n')}
];
`;
writeFileSync('src/data/colombiaCatalog.ts', ts);

const shapes = {};
for (const dp of depts) shapes[`div:co-${dp.spec.id}`] = { line: false, rings: dp.rings, tone: tone.get(dp.spec.id) };
shapes['borders:colombia'] = { line: true, rings: borders };
const json = JSON.stringify(shapes);
writeFileSync('src/data/packShapes.json', json);

const esc = (s) => String(s).replace(/'/g, "''");
const placeRows = [
  ...munis.map((mm) => `  ('co:${mm.id}', 'city', '${esc(mm.name)}', 'Colombia', ${mm.lat}, ${mm.lon})`),
  ...depts.map((dp) => `  ('div:co-${dp.spec.id}', 'division', '${esc(dp.spec.es)}', 'Colombia', ${dp.lat}, ${dp.lon})`),
];
const shapeRows = [];
for (const dp of depts) dp.rings.forEach((ring, i) => shapeRows.push(`  ('div:co-${dp.spec.id}', ${i}, array[${ring.map((p) => p[0]).join(',')}]::double precision[], array[${ring.map((p) => p[1]).join(',')}]::double precision[], false)`));
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/colombia_places.sql', `-- Generado por scripts/build-colombia.mjs (pack Colombia, Fase 7a). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${placeRows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where place_id like 'div:co-%';
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
${shapeRows.join(',\n')};
`);

// ── Documento de revisión ────────────────────────────────────────────────────
const TIER = { basic: 'Turista', easy: 'Rookie', medium: 'Crack', hard: 'Leyenda' };
const TIERS = ['basic', 'easy', 'medium', 'hard'];
let doc = `# Fase 7a · Pack Colombia — catálogo para revisión

Borrador (2026-10-23). Para cambiar algo: editar \`src/data/colombiaTiers.ts\` (departamentos y municipios),
\`src/data/featureTiers.ts\` (lugares, campo \`packs.colombia\`) o \`src/data/landmarkTiers.ts\` (monumentos) y volver a correr
los scripts (\`build-colombia\`, \`build-features\`, \`build-landmarks\` + \`convert-landmarks\`).

Niveles pensados para un jugador colombiano: **Turista** · **Rookie** · **Crack** · **Leyenda**. Si un nivel no llega a 13,
la partida se completa con el nivel vecino. Cercanía con escala de 150 km (fallar por 50 km ≈ 720 de 1.000; por 150 km ≈ 370).

## Departamentos (${depts.length})

Contorno de Natural Earth; tocar dentro vale cercanía perfecta, fuera cuenta la distancia al borde.

`;
for (const t of TIERS) {
  const c = depts.filter((dp) => dp.spec.tier === t).map((dp) => `${dp.spec.es} (capital: ${muniById.get(dp.spec.capital).name})`);
  if (c.length) doc += `- **${TIER[t]}** (${c.length}): ${c.join(' · ')}\n`;
}
doc += `\n## Ciudades y municipios (${munis.length})\n\nCoordenadas de Wikidata (${refined} de ${munis.length}; el resto, las de la spec). Se miden al punto.\n\n`;
for (const t of TIERS) {
  const c = munis.filter((mm) => mm.tier === t).map((mm) => `${mm.name} (${name.get(mm.dept)})`).sort((a, b) => a.localeCompare(b, 'es'));
  if (c.length) doc += `- **${TIER[t]}** (${c.length}): ${c.join(' · ')}\n`;
}
doc += '\n## Lugares y monumentos del pack\n\nVer la sección «Pack Colombia» de `docs/Fase6_Lugares_catalogo.md` y de `docs/Fase6_Monumentos_catalogo.md`.\n';
writeFileSync('docs/Fase7_Colombia_catalogo.md', doc);

const pts = Object.values(shapes).reduce((s, sh) => s + sh.rings.reduce((t, r) => t + r.length, 0), 0);
const count = (arr, fn) => arr.reduce((acc, x) => { const k = fn(x); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
console.log(`departamentos ${depts.length}`, count(depts, (dp) => dp.spec.tier), `fronteras internas ${borders.length} polilíneas (${internal.length} lados compartidos)`);
console.log(`municipios ${munis.length}`, count(munis, (mm) => mm.tier), `afinados con Wikidata ${refined}`, `máx. corrimiento ${Math.max(...munis.map((mm) => mm.moved ?? 0))} km`);
console.log(`packShapes ${(json.length / 1024).toFixed(0)} KB, ${pts} puntos`);
const lonely = [...neighbors].filter(([id, s]) => s.size === 0).map(([id]) => id);
if (lonely.length) console.log('sin vecinos:', lonely.join(', '));

/**
 * Packs Pro (Fase 7b) a partir de src/data/proPacksTiers.ts y Natural Earth (dominio público; los GeoJSON no van al repo):
 *  · divisiones: ne_10m_admin_1_states_provinces (estados, provincias, departamentos…), simplificadas; fronteras
 *    internas y vecinos desde los lados compartidos ANTES de simplificar (como build-colombia.mjs); un tono por
 *    división (coloreo de 4 colores) y la capital de cada una (ne_10m_populated_places, "Admin-1 capital").
 *  · ciudades: ne_10m_populated_places — capitales de país y de división y las de más de 100.000 habitantes.
 *  · niveles automáticos (para revisión): divisiones por tamaño (las más grandes, Turista) con los distritos capitales en
 *    Turista; ciudades por población con las capitales de país en Turista.
 *
 * Escribe src/data/proPackMeta.ts (límites del mapa y países de cada pack; pequeño, lo usa el mapa), src/data/proPackCatalog.ts
 * (ciudades y divisiones), src/data/proPackShapes.json (contornos, carga perezosa), supabase/seed/pro_pack_places.sql y
 * docs/Fase7b_Packs_Pro_catalogo.md.
 *
 * Uso: node scripts/build-pro-packs.mjs --ne <carpeta con los GeoJSON>
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const argi = process.argv.indexOf('--ne');
const NE = argi > 0 ? process.argv[argi + 1] : null;
if (!NE) { console.error('Uso: node scripts/build-pro-packs.mjs --ne <carpeta>'); process.exit(1); }
const read = (f) => readFileSync(f, 'utf8');

const tmp = mkdtempSync(join(tmpdir(), 'geospeed-propacks-'));
await build({ entryPoints: ['src/data/proPacksTiers.ts'], bundle: true, format: 'esm', outdir: tmp, logLevel: 'warning' });
const { PRO_PACKS } = await import(pathToFileURL(join(tmp, 'proPacksTiers.js')).href);

// ── Geometría (igual que build-colombia.mjs) ─────────────────────────────────
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
const r4 = (v) => Math.round(v * 1000) / 1000; // 3 decimales (~100 m): de sobra con una escala de 400 km
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
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TYPE = {
  'Capital District': 'district', 'Captial District': 'district', 'Federal District': 'district', 'National District': 'district',
  Province: 'province', 'National Territory': 'province', State: 'state', Department: 'department', Departamento: 'department',
  Region: 'region', 'Autonomous Region': 'region', Parish: 'parish', District: 'adistrict',
  'Federal Dependency': 'territory', 'Indigenous Territory': 'territory', 'Special Municipality': 'municipality',
};
const TYPE_ES = { district: 'distrito capital', province: 'provincia', state: 'estado', department: 'departamento', region: 'región', parish: 'parroquia', adistrict: 'distrito', territory: 'territorio', municipality: 'municipio' };
const TOL = { andes: 0.035, conosur: 0.05, mexcam: 0.03, caribe: 0.015 };
// Islas lejanas que estirarían el mapa del pack (Isla de Pascua y Sala y Gómez, de Chile)
const FAR_WEST = { conosur: -82 };

const admin1 = JSON.parse(read(join(NE, 'ne_10m_admin_1_states_provinces.geojson'))).features;
const places = JSON.parse(read(join(NE, 'ne_10m_populated_places.geojson'))).features.map((f) => ({ ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }));

const meta = {};
const allDivisions = [];
const allCities = [];
const shapes = {};
const problems = [];

for (const pack of PRO_PACKS) {
  const byA3 = new Map(pack.countries.map((c) => [c.a3, c]));
  const feats = admin1.filter((f) => byA3.has(f.properties.adm0_a3) && f.properties.name);
  const divs = [];
  const usedIds = new Set();
  for (const f of feats) {
    const p = f.properties;
    const country = byA3.get(p.adm0_a3);
    const g = f.geometry;
    let raw = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((x) => x[0]);
    if (FAR_WEST[pack.id] !== undefined) raw = raw.filter((r) => Math.max(...r.map((q) => q[0])) > FAR_WEST[pack.id]);
    if (!raw.length) continue;
    // Nombre en español sin el tipo delante ("Departamento del Beni" → "Beni"); "Capital" a secas → el nombre de Natural Earth
    let es = (p.name_es && !/^\s*$/.test(p.name_es) ? p.name_es : p.name)
      .replace(/^(Departamento|Provincia|Estado|Región) /i, '').replace(/^(del|de la|de los|de) /i, '').trim();
    if (/^capital$/i.test(es)) es = p.name;
    const typeEn = p.type_en ?? (country.iso === 'PR' ? 'Federal Dependency' : 'Capital District');
    const ftype = TYPE[typeEn] ?? 'province';
    // Dos divisiones con el mismo nombre en un país (Lima región y Lima metropolitana): la segunda lleva su tipo
    if (divs.some((dv) => dv.country.iso === country.iso && dv.es === es)) es = `${es} (${TYPE_ES[ftype] ?? 'división'})`;
    let id = `div:${country.iso.toLowerCase()}-${slug(es)}`;
    for (let k = 2; usedIds.has(id); k++) id = `div:${country.iso.toLowerCase()}-${slug(es)}-${k}`;
    usedIds.add(id);
    divs.push({ id, es, en: p.name_en || p.name, neName: p.name, country, ftype, capitalDistrict: ftype === 'district', raw });
  }

  // Lados compartidos → fronteras internas y vecinos
  const key = (q) => `${q[0].toFixed(5)},${q[1].toFixed(5)}`;
  const owners = new Map();
  for (const dv of divs) for (const ring of dv.raw) for (let i = 0; i + 1 < ring.length; i++) {
    const a = key(ring[i]), b = key(ring[i + 1]);
    if (a === b) continue;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!owners.has(k)) owners.set(k, new Set());
    owners.get(k).add(dv.id);
  }
  const nb = new Map(divs.map((dv) => [dv.id, new Set()]));
  const adj = new Map();
  for (const [k, o] of owners) {
    if (o.size < 2) continue;
    const [x, y] = [...o];
    nb.get(x).add(y); nb.get(y).add(x);
    const [a, b] = k.split('|');
    if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b); adj.get(b).push(a);
  }
  const used = new Set();
  const ek = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const chains = [];
  const starts = [...adj.keys()].sort((p, q) => (adj.get(p).length !== 2 ? 0 : 1) - (adj.get(q).length !== 2 ? 0 : 1));
  for (const s of starts) for (const n0 of adj.get(s)) {
    if (used.has(ek(s, n0))) continue;
    const chain = [s];
    let cur = n0;
    used.add(ek(s, n0));
    for (;;) {
      chain.push(cur);
      if (adj.get(cur).length !== 2) break;
      const next = adj.get(cur).find((n) => !used.has(ek(cur, n)));
      if (!next) break;
      used.add(ek(cur, next));
      cur = next;
    }
    chains.push(chain.map((t) => t.split(',').map(Number)));
  }
  const tol = TOL[pack.id];
  shapes[`borders:${pack.id}`] = { line: true, rings: chains.map((ch) => clean(simplify(ch, tol), false)).filter((ch) => ch.length >= 2) };

  // Tono (4 colores)
  const tone = new Map();
  for (const id of [...nb.keys()].sort((a, b) => nb.get(b).size - nb.get(a).size)) {
    const taken = new Set([...nb.get(id)].map((n) => tone.get(n)).filter((t) => t !== undefined));
    let t = 0; while (taken.has(t)) t++;
    tone.set(id, t % 4);
  }

  // Contornos simplificados, punto interior y área
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const dv of divs) {
    let rings = dv.raw.map((r) => clean(simplify(r, tol), true)).filter((r) => r.length >= 4);
    if (!rings.length) rings = dv.raw.map((r) => clean(r, true)).filter((r) => r.length >= 4);
    rings.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
    rings = rings.filter((r, i) => i === 0 || Math.abs(ringArea(r)) >= 0.006).slice(0, 6);
    dv.rings = rings;
    dv.area = rings.reduce((s, r) => s + Math.abs(ringArea(r)), 0);
    const [lon, lat] = innerPoint(rings[0]);
    dv.lat = +lat.toFixed(3); dv.lon = +lon.toFixed(3);
    for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    shapes[dv.id] = { line: false, rings, tone: tone.get(dv.id) };
  }
  const padX = Math.max(0.6, (x1 - x0) * 0.04), padY = Math.max(0.6, (y1 - y0) * 0.04);
  const bounds = { latMin: +(y0 - padY).toFixed(1), latMax: +(y1 + padY).toFixed(1), lonMin: +(x0 - padX).toFixed(1), lonMax: +(x1 + padX).toFixed(1) };

  // Niveles de las divisiones: distritos capitales en Turista; el resto por tamaño (20 % · 25 % · 25 % · 30 %)
  const ranked = divs.filter((dv) => !dv.capitalDistrict).sort((a, b) => b.area - a.area);
  ranked.forEach((dv, i) => { const q = i / ranked.length; dv.tier = q < 0.2 ? 'basic' : q < 0.45 ? 'easy' : q < 0.7 ? 'medium' : 'hard'; });
  for (const dv of divs) if (dv.capitalDistrict) dv.tier = 'basic';
  // …pero una división pequeña con una gran ciudad también es conocida (Pichincha, Miranda): se queda con el nivel más
  // fácil entre el de su tamaño y el de su ciudad más poblada (≥ 1 M Turista · ≥ 400 mil Rookie · ≥ 150 mil Crack)
  const ORDER = ['basic', 'easy', 'medium', 'hard'];
  for (const dv of divs) {
    const pop = Math.max(0, ...places.filter((pl) => pl.ADM0_A3 === dv.country.a3 && pl.ADM1NAME === dv.neName).map((pl) => pl.POP_MAX ?? 0));
    const popTier = pop >= 1e6 ? 'basic' : pop >= 4e5 ? 'easy' : pop >= 1.5e5 ? 'medium' : 'hard';
    if (ORDER.indexOf(popTier) < ORDER.indexOf(dv.tier)) dv.tier = popTier;
  }

  // Ciudades
  const inPack = places.filter((pl) => byA3.has(pl.ADM0_A3) && pl.lon >= bounds.lonMin && pl.lon <= bounds.lonMax && pl.lat >= bounds.latMin && pl.lat <= bounds.latMax);
  const divByNe = new Map(divs.map((dv) => [`${dv.country.a3}|${dv.neName}`, dv]));
  const capitals = {};
  for (const pl of inPack) if (pl.ADM0CAP === 1) capitals[byA3.get(pl.ADM0_A3).iso] = { name: pl.NAME, lat: +pl.lat.toFixed(4), lon: +pl.lon.toFixed(4) };
  // Territorios sin capital de país en Natural Earth (Puerto Rico): la ciudad más poblada como referencia de las pistas
  for (const ctry of pack.countries) {
    if (capitals[ctry.iso]) continue;
    const top = inPack.filter((pl) => pl.ADM0_A3 === ctry.a3).sort((a, b) => (b.POP_MAX ?? 0) - (a.POP_MAX ?? 0))[0];
    if (top) capitals[ctry.iso] = { name: top.NAME, lat: +top.lat.toFixed(4), lon: +top.lon.toFixed(4) };
    else problems.push(`${pack.id}: sin ciudades de ${ctry.es}`);
  }
  const isA1Cap = (pl) => /Admin-1 capital/i.test(pl.FEATURECLA ?? '');
  for (const pl of inPack) if (isA1Cap(pl)) { const dv = divByNe.get(`${pl.ADM0_A3}|${pl.ADM1NAME}`); if (dv && !dv.capital) dv.capital = pl.NAME; }
  let cands = inPack.filter((pl) => pl.ADM0CAP === 1 || isA1Cap(pl) || (pl.POP_MAX ?? 0) >= 100000);
  cands.sort((a, b) => (b.ADM0CAP === 1) - (a.ADM0CAP === 1) || isA1Cap(b) - isA1Cap(a) || (b.POP_MAX ?? 0) - (a.POP_MAX ?? 0));
  const seenName = new Set();
  cands = cands.filter((pl) => { const k = `${pl.ADM0_A3}|${slug(pl.NAME)}`; if (seenName.has(k)) return false; seenName.add(k); return true; }).slice(0, 150);
  const byPop = [...cands].sort((a, b) => (b.ADM0CAP === 1) - (a.ADM0CAP === 1) || (b.POP_MAX ?? 0) - (a.POP_MAX ?? 0));
  const nBasic = Math.max(14, Math.round(byPop.length * 0.15));
  const cities = byPop.map((pl, i) => {
    const country = byA3.get(pl.ADM0_A3);
    const dv = divByNe.get(`${pl.ADM0_A3}|${pl.ADM1NAME}`);
    const q = i / byPop.length;
    const tier = pl.ADM0CAP === 1 || i < nBasic ? 'basic' : q < 0.4 ? 'easy' : q < 0.7 ? 'medium' : 'hard';
    return { id: `ci:${country.iso.toLowerCase()}-${slug(pl.NAME)}`, name: pl.NAME, country: country.es, admin: dv?.es ?? pl.ADM1NAME ?? '', isCapital: pl.ADM0CAP === 1 || (dv?.capital === pl.NAME), natCap: pl.ADM0CAP === 1, lat: +pl.lat.toFixed(4), lon: +pl.lon.toFixed(4), tier, pop: pl.POP_MAX ?? 0, pack: pack.id };
  });

  for (const dv of divs) allDivisions.push({ ...dv, nbNames: [...nb.get(dv.id)].map((id) => divs.find((x) => x.id === id).es).sort((a, b) => a.localeCompare(b, 'es')), pack: pack.id });
  allCities.push(...cities);
  meta[pack.id] = { es: pack.es, en: pack.en, bounds, isos: pack.countries.map((c2) => c2.iso), capitals };
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// ── Salidas ──────────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
writeFileSync('src/data/proPackMeta.ts', `// Generado por scripts/build-pro-packs.mjs. No editar a mano.
/** Packs Pro (Fase 7b): límites del mapa, países (ISO) y capitales de cada pack */
export interface ProPackMeta { es: string; en: string; bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number }; isos: string[]; capitals: Record<string, { name: string; lat: number; lon: number }> }
export const PRO_PACK_META: Record<'andes' | 'conosur' | 'mexcam' | 'caribe', ProPackMeta> = ${JSON.stringify(meta, null, 1)};
`);
writeFileSync('src/data/proPackCatalog.ts', `// Generado por scripts/build-pro-packs.mjs a partir de proPacksTiers.ts + Natural Earth. No editar a mano.
import type { City } from './cities';

/** Packs Pro (Fase 7b): ciudades (al punto). region = pack; admin = división. */
export const PRO_PACK_CITIES: City[] = [
${allCities.map((ct) => `  { id: '${ct.id}', name: ${q(ct.name)}, country: ${q(ct.country)}, admin: ${q(ct.admin)}, ${ct.isCapital ? 'isCapital: true, ' : ''}lat: ${ct.lat}, lon: ${ct.lon}, difficulty: '${ct.tier}', region: '${ct.pack}' },`).join('\n')}
];

/** Packs Pro: divisiones (área, contorno en proPackShapes.json). */
export const PRO_PACK_DIVISIONS: City[] = [
${allDivisions.map((dv) => `  { id: '${dv.id}', kind: 'division', geom: 'area', ftype: '${dv.ftype}', name: ${q(dv.es)}, nameEn: ${q(dv.en)}, country: ${q(dv.country.es)}, ${dv.capital ? `capital: ${q(dv.capital)}, ` : ''}nb: [${dv.nbNames.map(q).join(', ')}], lat: ${dv.lat}, lon: ${dv.lon}, difficulty: '${dv.tier}', region: '${dv.pack}' },`).join('\n')}
];
`);
const json = JSON.stringify(shapes);
writeFileSync('src/data/proPackShapes.json', json);

const esc = (s) => String(s).replace(/'/g, "''");
const placeRows = [
  ...allCities.map((ct) => `  ('${ct.id}', 'city', '${esc(ct.name)}', '${esc(ct.country)}', ${ct.lat}, ${ct.lon})`),
  ...allDivisions.map((dv) => `  ('${dv.id}', 'division', '${esc(dv.es)}', '${esc(dv.country.es)}', ${dv.lat}, ${dv.lon})`),
];
const shapeRows = [];
for (const dv of allDivisions) dv.rings.forEach((ring, i) => shapeRows.push(`  ('${dv.id}', ${i}, array[${ring.map((p) => p[0]).join(',')}]::double precision[], array[${ring.map((p) => p[1]).join(',')}]::double precision[], false)`));
const prefixes = [...new Set(allDivisions.map((dv) => dv.id.slice(0, 7)))];
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/pro_pack_places.sql', `-- Generado por scripts/build-pro-packs.mjs (packs Pro, Fase 7b). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${placeRows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where ${prefixes.map((p) => `place_id like '${p}%'`).join(' or ')};
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
${shapeRows.join(',\n')};
`);

const TIER = { basic: 'Turista', easy: 'Rookie', medium: 'Crack', hard: 'Leyenda' };
const TIERS = ['basic', 'easy', 'medium', 'hard'];
let doc = `# Fase 7b · Packs Pro — catálogo para revisión

Borrador (2026-10-24). Países por pack en \`src/data/proPacksTiers.ts\`; todo lo demás sale de Natural Earth con
\`node scripts/build-pro-packs.mjs --ne <carpeta>\`. **Los niveles son automáticos**: divisiones por tamaño (las más grandes en
Turista; los distritos capitales siempre en Turista) y ciudades por población (las capitales de país siempre en Turista). Si
algo no te cuadra, dime qué subir o bajar y lo fijo a mano. Lugares y monumentos: los del catálogo que están en esos países
(si una categoría no llega a 13, no se ofrece en ese pack). Escala de cercanía: 400 km.

`;
for (const pack of PRO_PACKS) {
  const divs = allDivisions.filter((dv) => dv.pack === pack.id);
  const cts = allCities.filter((ct) => ct.pack === pack.id);
  doc += `## ${pack.es} (${pack.countries.map((c2) => c2.es).join(', ')})\n\n### Divisiones (${divs.length})\n\n`;
  for (const t of TIERS) {
    const l = divs.filter((dv) => dv.tier === t).map((dv) => `${dv.es} (${dv.country.es})`).sort((a, b) => a.localeCompare(b, 'es'));
    if (l.length) doc += `- **${TIER[t]}** (${l.length}): ${l.join(' · ')}\n`;
  }
  doc += `\n### Ciudades (${cts.length})\n\n`;
  for (const t of TIERS) {
    const l = cts.filter((ct) => ct.tier === t).map((ct) => `${ct.name} (${ct.country})`).sort((a, b) => a.localeCompare(b, 'es'));
    if (l.length) doc += `- **${TIER[t]}** (${l.length}): ${l.join(' · ')}\n`;
  }
  doc += '\n';
}
writeFileSync('docs/Fase7b_Packs_Pro_catalogo.md', doc);

for (const pack of PRO_PACKS) {
  const d = allDivisions.filter((dv) => dv.pack === pack.id), ct = allCities.filter((x) => x.pack === pack.id);
  console.log(`${pack.id}: divisiones ${d.length} (sin capital ${d.filter((x) => !x.capital).length}) · ciudades ${ct.length} · límites ${JSON.stringify(meta[pack.id].bounds)}`);
}
const pts = Object.values(shapes).reduce((s, sh) => s + sh.rings.reduce((t, r) => t + r.length, 0), 0);
console.log(`proPackShapes ${(json.length / 1024).toFixed(0)} KB, ${pts} puntos`);

/**
 * Conquista el mapa — fase C1: verifica y genera el banco de ciudades (12 por país) a partir de src/data/conquestTiers.ts.
 *
 * Por cada ciudad de la lista:
 *  1. Reutiliza la ciudad del juego si ya existe (mismo país y nombre ES/EN, a menos de 25 km): prefiere el id del mundo,
 *     luego `co:` y `ci:`. Así conserva foto, ficha, reseña y sus coordenadas oficiales del servidor.
 *  2. Si no existe, la crea como `cq:<iso>-<slug>` con las coordenadas de Wikidata (P625).
 *  3. Verifica con Wikidata (QID de la ficha, el `q` de la lista o búsqueda por nombre) que el país (P17) sea el correcto y
 *     que el punto quede a menos de 30 km del aproximado de la lista, y toma los nombres ES/EN.
 *  4. Verifica que el punto caiga dentro del contorno del país en countries.ts (o a menos de 30 km de su costa).
 *
 * Escribe src/data/conquestCatalog.ts (países con encuadre del mapa y los ids del banco; ciudades nuevas `cq:`),
 * supabase/seed/conquest_bank.sql (lugares nuevos + banco, para la migración de la fase C2) y
 * docs/Conquista_C1_Ciudades.md (revisión). Falla si un país no queda con 12 ciudades verificadas.
 *
 * Uso: node scripts/build-conquest-catalog.mjs [--cache <carpeta>]
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const CACHE = arg('--cache') ?? join(tmpdir(), 'geospeed-conquest-cache');
mkdirSync(CACHE, { recursive: true });
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const f = join(CACHE, createHash('md5').update(url).digest('hex') + '.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }).catch(() => null);
    if (res?.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(250); return j; }
    await sleep(3000 * 2 ** attempt);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 160)}`);
}

// ── Catálogo del juego ───────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-conquest-'));
writeFileSync(join(tmp, 'e.ts'), `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
export { PRO_PACK_CITIES } from '@/data/proPackCatalog';
export { countries } from '@/data/countries';
export { countryIso } from '@/lib/flags';
export { CITY_PHOTO_IDS } from '@/data/cityPhotoIds';
export { CONQUEST_COUNTRIES_SPEC } from '@/data/conquestTiers';
`);
await build({ entryPoints: [join(tmp, 'e.ts')], bundle: true, format: 'esm', outfile: join(tmp, 'e.js'), alias: { '@': resolve('src') }, logLevel: 'error', loader: { '.json': 'json' } });
const C = await import(pathToFileURL(join(tmp, 'e.js')).href);
const facts = JSON.parse(readFileSync('src/data/placeFacts.json', 'utf8'));
const photos = new Set(C.CITY_PHOTO_IDS);

const all = [];
const seen = new Set();
const push = (c, src) => { if (c.id && !seen.has(c.id)) { seen.add(c.id); all.push({ ...c, src }); } };
for (const l of [C.worldCities, C.europeCities, C.asiaCities, C.americasCities, C.africaCities]) for (const c of l) push(c, 'mundo');
for (const c of C.COLOMBIA_CITIES) push({ ...c, iso: 'CO' }, 'co');
for (const c of C.PRO_PACK_CITIES) push(c, 'pro');
const isoOf = (c) => c.iso ?? C.countryIso(c.country);

const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-');
const hav = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const SRC_RANK = { mundo: 0, co: 1, pro: 2 };

// ── Wikidata ─────────────────────────────────────────────────────────────────
const COUNTRY_Q = { CO: 'Q739', PE: 'Q419', EC: 'Q736', CL: 'Q298', AR: 'Q414', BR: 'Q155', MX: 'Q96', ES: 'Q29', FR: 'Q142', IT: 'Q38' };
async function entities(qs) {
  const out = {};
  for (let i = 0; i < qs.length; i += 50) {
    const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qs.slice(i, i + 50).join('|')}&props=claims|labels&languages=es|en&format=json`);
    Object.assign(out, j.entities ?? {});
  }
  return out;
}
const claimIds = (e, p) => (e?.claims?.[p] ?? []).map((x) => x.mainsnak?.datavalue?.value?.id).filter(Boolean);
const coord = (e) => { const v = e?.claims?.P625?.[0]?.mainsnak?.datavalue?.value; return v ? [v.latitude, v.longitude] : null; };
async function search(name, lang) {
  const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=${lang}&limit=10&type=item&format=json`);
  return (j.search ?? []).map((x) => x.id);
}

// ── Contornos de país (countries.ts) ─────────────────────────────────────────
const inRing = (x, y, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
/** Distancia (km) del punto al borde del anillo: segmentos en un plano local equirectangular alrededor del punto */
const ringDistKm = (lat, lon, ring) => {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180), ky = 110.57;
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = (ring[j][0] - lon) * kx, ay = (ring[j][1] - lat) * ky, bx = (ring[i][0] - lon) * kx, by = (ring[i][1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
};
const countryOf = (iso) => C.countries.find((k) => C.countryIso(k.name) === iso);

// ── Proceso ──────────────────────────────────────────────────────────────────
const problems = [];
const result = [];
for (const spec of C.CONQUEST_COUNTRIES_SPEC) {
  const shape = countryOf(spec.iso);
  if (!shape) { problems.push(`${spec.iso}: país sin contorno`); continue; }
  const rows = [];
  for (const cs of spec.cities) {
    // 1. ¿ya existe en el juego?
    const cand = all.filter((c) => isoOf(c) === spec.iso && (norm(c.name) === norm(cs.es) || norm(c.name) === norm(cs.en)) && hav(c.lat, c.lon, cs.lat, cs.lon) < 25)
      .sort((a, b) => SRC_RANK[a.src] - SRC_RANK[b.src]);
    const existing = cand[0] ?? null;
    // 2–3. Wikidata
    let q = existing ? facts[existing.id]?.q ?? cs.q ?? null : cs.q ?? null;
    let ent = null;
    const ok = (e) => e && claimIds(e, 'P17').includes(COUNTRY_Q[spec.iso]) && coord(e) && hav(coord(e)[0], coord(e)[1], cs.lat, cs.lon) < 30;
    if (q) { ent = (await entities([q]))[q]; if (!ok(ent)) ent = null; }
    if (!ent) {
      const ids = [...new Set([...(await search(cs.es, 'es')), ...(await search(cs.en, 'en'))])];
      const ents = ids.length ? await entities(ids) : {};
      // Primero las que se llaman exactamente como la ciudad (si no, cerca del punto sale la estación, la universidad
      // o la provincia homónima), luego la más cercana
      const named = (e) => [e.labels?.es?.value, e.labels?.en?.value].some((l) => l && (norm(l) === norm(cs.es) || norm(l) === norm(cs.en)));
      const good = Object.entries(ents).filter(([, e]) => ok(e))
        .sort(([, a], [, b]) => Number(named(b)) - Number(named(a)) || hav(coord(a)[0], coord(a)[1], cs.lat, cs.lon) - hav(coord(b)[0], coord(b)[1], cs.lat, cs.lon));
      if (good.length) { q = good[0][0]; ent = good[0][1]; }
    }
    if (!ent) { problems.push(`${spec.iso} ${cs.es}: sin entidad de Wikidata en el país a < 30 km`); continue; }
    const wd = coord(ent);
    const lat = existing ? existing.lat : +wd[0].toFixed(4);
    const lon = existing ? existing.lon : +wd[1].toFixed(4);
    // 4. dentro del país
    const inside = shape.polygons.some((r) => inRing(lon, lat, r));
    const coastKm = inside ? 0 : Math.round(Math.min(...shape.polygons.map((r) => ringDistKm(lat, lon, r))));
    // El mapa 1:110m no trae islas como Mallorca: ahí manda el país de Wikidata (P17, ya verificado); solo se rechaza
    // un punto muy lejos de todo el contorno
    if (!inside && coastKm > 300) problems.push(`${spec.iso} ${cs.es}: lejos del contorno del país (${coastKm} km)`);
    const id = existing ? existing.id : `cq:${spec.iso.toLowerCase()}-${slug(cs.es)}`;
    rows.push({
      id, reused: existing ? existing.src : null, es: existing ? existing.name : cs.es, en: cs.en,
      wdEs: ent.labels?.es?.value ?? null, wdEn: ent.labels?.en?.value ?? null, q, lat, lon,
      kmSpec: Math.round(hav(lat, lon, cs.lat, cs.lon)), kmWd: Math.round(hav(lat, lon, wd[0], wd[1])),
      inside, coastKm, photo: photos.has(id),
    });
  }
  if (rows.length !== 12) problems.push(`${spec.iso}: ${rows.length} ciudades verificadas (se necesitan 12)`);
  if (new Set(rows.map((r) => r.id)).size !== rows.length) problems.push(`${spec.iso}: ids repetidos`);
  // Encuadre del mapa de la misión: los anillos del país que contienen (o tocan) una ciudad del banco
  const rings = shape.polygons.filter((r) => rows.some((c) => inRing(c.lon, c.lat, r) || ringDistKm(c.lat, c.lon, r) < 60));
  const xs = [...rings.flat().map((p) => p[0]), ...rows.map((c) => c.lon)], ys = [...rings.flat().map((p) => p[1]), ...rows.map((c) => c.lat)];
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const mx = (x1 - x0) * 0.06, my = (y1 - y0) * 0.06;
  const bounds = [+(x0 - mx).toFixed(2), +(y0 - my).toFixed(2), +(x1 + mx).toFixed(2), +(y1 + my).toFixed(2)];
  if (rows.some((c) => c.lon < bounds[0] || c.lon > bounds[2] || c.lat < bounds[1] || c.lat > bounds[3])) problems.push(`${spec.iso}: el encuadre deja ciudades afuera`);
  result.push({ iso: spec.iso, es: spec.es, en: spec.en, bounds, rows });
}

if (problems.length) { console.error('PROBLEMAS:\n' + problems.join('\n')); process.exit(1); }

// ── Salidas ──────────────────────────────────────────────────────────────────
const q = (s) => JSON.stringify(s);
const newCities = result.flatMap((k) => k.rows.filter((r) => !r.reused).map((r) => ({ ...r, iso: k.iso, country: k.es })));
writeFileSync('src/data/conquestCatalog.ts', `// Generado por scripts/build-conquest-catalog.mjs desde src/data/conquestTiers.ts. No editar a mano.
import type { City } from './cities';

/** País de Conquista: encuadre del mapa de la misión [lonMin, latMin, lonMax, latMax] y las 12 ciudades del banco */
export interface ConquestCountry { iso: string; name: string; nameEn: string; bounds: [number, number, number, number]; cityIds: string[] }

export const CONQUEST_COUNTRIES: ConquestCountry[] = [
${result.map((k) => `  { iso: ${q(k.iso)}, name: ${q(k.es)}, nameEn: ${q(k.en)}, bounds: [${k.bounds.join(', ')}], cityIds: [${k.rows.map((r) => q(r.id)).join(', ')}] },`).join('\n')}
];

/** Ciudades del banco que no estaban en el juego (las demás se reutilizan con su id del mundo, \`co:\` o \`ci:\`) */
export const CONQUEST_CITIES: City[] = [
${newCities.map((r) => `  { id: ${q(r.id)}, kind: 'city', name: ${q(r.es)}, nameEn: ${q(r.en)}, country: ${q(r.country)}, iso: ${q(r.iso)}, lat: ${r.lat}, lon: ${r.lon}, difficulty: 'basic' },`).join('\n')}
];
`);

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/conquest_bank.sql', `-- Generado por scripts/build-conquest-catalog.mjs (fase C1 de Conquista). Lo incluye la migración de la fase C2,
-- después de crear public.conq_bank. Idempotente.

-- Ciudades nuevas (las demás ya están en public.places con su id del mundo, co: o ci:)
insert into public.places (id, kind, name, country, lat, lon) values
${newCities.map((r) => `  (${sqlStr(r.id)}, 'city', ${sqlStr(r.es)}, ${sqlStr(r.country)}, ${r.lat}, ${r.lon})`).join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

-- Ciudades reutilizadas: ya deberían estar (mundo, pack Colombia, packs Pro); por si falta alguna migración de packs, se
-- insertan con sus coordenadas oficiales sin tocar las que existan
insert into public.places (id, kind, name, country, lat, lon) values
${result.flatMap((k) => k.rows.filter((r) => r.reused).map((r) => `  (${sqlStr(r.id)}, 'city', ${sqlStr(r.es)}, ${sqlStr(k.es)}, ${r.lat}, ${r.lon})`)).join(',\n')}
on conflict (id) do nothing;

-- Banco: 12 ciudades por país, en el orden de la lista
insert into public.conq_bank (country_iso, place_id, ord) values
${result.flatMap((k) => k.rows.map((r, i) => `  (${sqlStr(k.iso)}, ${sqlStr(r.id)}, ${i + 1})`)).join(',\n')}
on conflict (country_iso, place_id) do update set ord = excluded.ord;
`);

const SRC_ES = { mundo: 'del mundo', co: 'pack Colombia', pro: 'pack Pro' };
let doc = `# Conquista · fase C1 · banco de ciudades (para revisar)

Generado por \`node scripts/build-conquest-catalog.mjs\` desde \`src/data/conquestTiers.ts\`. Doce ciudades conocidas por
país (decisión CQ-D2). Cada temporada el servidor arma con este banco un paquete de cinco ciudades por país. Todas se
verificaron con Wikidata: el país (P17) es el correcto y el punto está a menos de 30 km del aproximado de la lista; y caen
dentro del contorno del país del mapa (o a pocos km de su costa).

- **Reutilizada**: ya estaba en el juego; conserva su id, sus coordenadas oficiales del servidor, foto, ficha y reseña.
- **Nueva**: se agrega como \`cq:<país>-<nombre>\` con las coordenadas de Wikidata; sin foto propia todavía (la tarjeta usa
  la del país).

Para cambiar una ciudad: editar \`src/data/conquestTiers.ts\` y volver a correr el script.

| País | Reutilizadas | Nuevas | Con foto propia | Encuadre del mapa (lon, lat) |
|---|---|---|---|---|
${result.map((k) => `| ${k.es} | ${k.rows.filter((r) => r.reused).length} | ${k.rows.filter((r) => !r.reused).length} | ${k.rows.filter((r) => r.photo).length} | ${k.bounds[0]}…${k.bounds[2]}, ${k.bounds[1]}…${k.bounds[3]} |`).join('\n')}
`;
for (const k of result) {
  doc += `\n## ${k.es}\n\n| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |\n|---|---|---|---|---|---|---|\n`;
  k.rows.forEach((r, i) => {
    doc += `| ${i + 1} | ${r.es} / ${r.en} | ${r.reused ? `reutilizada (${SRC_ES[r.reused]}, \`${r.id}\`)` : `nueva (\`${r.id}\`)`} | ${r.lat.toFixed(3)}, ${r.lon.toFixed(3)} | [${r.q}](https://www.wikidata.org/wiki/${r.q}) ${r.wdEs ?? ''}${r.kmWd > 5 ? ` (${r.kmWd} km del punto de Wikidata)` : ''} | ${r.inside ? '✓' : r.coastKm <= 30 ? `costa (${r.coastKm} km)` : `isla fuera del mapa 1:110m (${r.coastKm} km)`} | ${r.photo ? '✓' : '—'} |\n`;
  });
}
writeFileSync('docs/Conquista_C1_Ciudades.md', doc);

console.log(result.map((k) => `${k.iso}: ${k.rows.length} (${k.rows.filter((r) => r.reused).length} reutilizadas, ${k.rows.filter((r) => !r.reused).length} nuevas)`).join(' · '));
console.log(`nuevas: ${newCities.length}`);

/**
 * Catálogo de monumentos (Fase 6c) a partir de src/data/landmarkTiers.ts (qué monumentos entran, nombre ES/EN,
 * ciudad, país, nivel, coordenadas aproximadas y, si se conoce, su id de Wikidata) y de Wikidata / Wikimedia
 * Commons: coordenadas exactas (P625) y la imagen principal (P18) con su autor y licencia (libres: CC BY,
 * CC BY-SA, CC0, dominio público).
 *
 * Escribe:
 *  1) src/data/landmarkCatalog.ts — un ítem por monumento con la forma de `City` (kind 'monument', id `mon:<slug>`,
 *     nameEn, city, país en español, lat/lon exactas, región, photo).
 *  2) <scratch>/landmarks/<slug>.<ext> + <scratch>/landmarks/meta.json — las fotos originales (miniatura de 960 px
 *     de Commons) y sus créditos, que scripts/convert-landmarks.py convierte a public/landmarks/*.webp + credits.json.
 *  3) supabase/seed/landmark_places.sql — los mismos lugares en `places` (kind 'monument'); se miden al punto, como
 *     una ciudad, así que no llevan contorno.
 *  4) docs/Fase6_Monumentos_catalogo.md — listado por región y nivel con la licencia de cada foto, para revisión.
 *
 * Uso: node scripts/build-landmarks.mjs --out <carpeta de trabajo>   (las respuestas de la API se guardan ahí y
 * no se vuelven a pedir en la siguiente corrida)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const argi = process.argv.indexOf('--out');
const OUT = argi > 0 ? process.argv[argi + 1] : process.env.LANDMARKS_DIR;
if (!OUT) { console.error('Falta --out <carpeta de trabajo>'); process.exit(1); }
mkdirSync(join(OUT, 'cache'), { recursive: true });
mkdirSync(join(OUT, 'img'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, cacheKey) {
  const f = join(OUT, 'cache', cacheKey.replace(/[^a-z0-9_-]/gi, '_') + '.json');
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(150); return j; }
    if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`sin respuesta: ${url}`);
}
async function download(url, file) {
  if (existsSync(file)) return true;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) { writeFileSync(file, Buffer.from(await res.arrayBuffer())); await sleep(200); return true; }
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
    console.warn(`  foto no descargada (${res.status}): ${url}`);
    return false;
  }
  return false;
}

// ── Especificación (TS → JS con esbuild) ─────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-landmarks-'));
await build({ entryPoints: ['src/data/landmarkTiers.ts'], bundle: true, format: 'esm', outdir: tmp, alias: { '@': resolve('src') }, logLevel: 'warning' });
const { LANDMARKS } = await import(pathToFileURL(join(tmp, 'landmarkTiers.js')).href);

// ── countries.ts: región por el país del punto ───────────────────────────────
const cs = read('src/data/countries.ts');
const countries = JSON.parse(cs.slice(cs.indexOf('= [') + 2, cs.lastIndexOf('];') + 1));
for (const c of countries) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of c.polygons) for (const [x, y] of ring) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  c.bbox = [x0, y0, x1, y1];
}
const REGION = { Europe: 'europe', Asia: 'asia', Africa: 'africa', Americas: 'americas', Oceania: null };
const regionOf = new Map();
for (const mm of read('src/lib/mapContinents.ts').matchAll(/(\w+): new Set\(\[([^\]]*)\]\)/g)) {
  if (!(mm[1] in REGION)) continue;
  for (const name of Function(`return [${mm[2]}]`)()) regionOf.set(name, REGION[mm[1]]);
}
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function countryAt(lon, lat, maxDeg = 1.5) {
  for (const c of countries) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    for (const ring of c.polygons) if (ring.length >= 3 && pointInRing(lon, lat, ring)) return c;
  }
  let best = null, bd = maxDeg * maxDeg;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const c of countries) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lon < x0 - maxDeg || lon > x1 + maxDeg || lat < y0 - maxDeg || lat > y1 + maxDeg) continue;
    for (const ring of c.polygons) for (const [x, y] of ring) { const dx = (x - lon) * k, dy = y - lat, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = c; } }
  }
  return best;
}
const haversine = (a, b, c, d) => { const r = Math.PI / 180, dLat = (c - a) * r, dLon = (d - b) * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLon / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(h)); };

// ── Wikidata ─────────────────────────────────────────────────────────────────
const WD = 'https://www.wikidata.org/w/api.php';
const claimsOf = (ent, p) => (ent?.claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
async function entities(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const j = await getJson(`${WD}?action=wbgetentities&ids=${chunk.join('|')}&props=claims|labels&languages=en|es&format=json`, `ent_${chunk.join('_')}`);
    Object.assign(out, j.entities ?? {});
  }
  return out;
}
async function search(name, lang = 'en') {
  const j = await getJson(`${WD}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=${lang}&uselang=${lang}&type=item&limit=7&format=json`, `search_${lang}_${name}`);
  return (j.search ?? []).map((s) => s.id);
}
/** Candidatos: nombre EN, EN sin paréntesis, ES; se queda con el primero a ≤ 30 km que tenga imagen, si no el primero a ≤ 30 km */
async function resolveEntity(spec) {
  const queries = [[spec.en, 'en'], [spec.en.replace(/\s*\(.*\)\s*/, ''), 'en'], [spec.es, 'es'], [spec.es.replace(/\s*\(.*\)\s*/, ''), 'es']];
  let near = null;
  for (const [name, lang] of queries) {
    if (!name) continue;
    const ids = await search(name, lang);
    const ents = ids.length ? await entities(ids) : {};
    for (const id of ids) {
      const e = ents[id];
      const c = coordsOf(e);
      if (!c || haversine(c.lat, c.lon, spec.lat, spec.lon) > 30) continue;
      if (claimsOf(e, 'P18').length) return e;
      near ??= e;
    }
  }
  return near;
}
function coordsOf(ent) {
  const c = claimsOf(ent, 'P625')[0];
  return c ? { lat: c.latitude, lon: c.longitude } : null;
}

// ── Commons ──────────────────────────────────────────────────────────────────
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const stripHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const FREE = /^(CC[- ]BY(?:[- ]SA)?(?:[- ]\d\.\d)?|CC0|Public domain|PD)/i;
async function imageInfo(fileName) {
  const title = 'File:' + fileName;
  const j = await getJson(`${COMMONS}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|url|mime&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|Credit|ImageDescription&format=json`, `img_${fileName}`);
  const page = Object.values(j.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const m = info.extmetadata ?? {};
  return {
    author: stripHtml(m.Artist?.value) || stripHtml(m.Credit?.value) || 'Wikimedia Commons',
    license: stripHtml(m.LicenseShortName?.value),
    licenseUrl: stripHtml(m.LicenseUrl?.value),
    url: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
    mime: info.mime,
  };
}

// ── Catálogo ─────────────────────────────────────────────────────────────────
const items = [];
const problems = [];
const seen = new Set();
const withQ = LANDMARKS.filter((l) => l.q).map((l) => l.q);
const preloaded = withQ.length ? await entities(withQ) : {};
for (const spec of LANDMARKS) {
  if (seen.has(spec.id)) problems.push(`id repetido: ${spec.id}`);
  seen.add(spec.id);
  let ent = spec.q ? preloaded[spec.q] : null;
  let how = spec.q ? 'q' : 'none';
  if (ent) {
    const c0 = coordsOf(ent);
    if (!c0 || haversine(c0.lat, c0.lon, spec.lat, spec.lon) > 30) { problems.push(`${spec.id}: Wikidata ${ent.id} queda a ${c0 ? haversine(c0.lat, c0.lon, spec.lat, spec.lon).toFixed(0) : '?'} km del punto de la spec; se busca por nombre`); ent = null; how = 'none'; }
  }
  if (!ent) { ent = await resolveEntity(spec); if (ent) how = 'search'; }
  const c = ent ? coordsOf(ent) : null;
  const lat = c ? +c.lat.toFixed(4) : spec.lat, lon = c ? +c.lon.toFixed(4) : spec.lon;
  // Imagen principal (P18): la primera con licencia CC / dominio público; las demás (GFDL, FAL, KOGL…) se saltan
  const images = ent ? claimsOf(ent, 'P18') : [];
  let photo = null;
  const rejected = [];
  for (const image of images) {
    const info = await imageInfo(image);
    if (!info) { rejected.push(`${image}: sin datos`); continue; }
    if (!FREE.test(info.license)) { rejected.push(`${image}: ${info.license}`); continue; }
    const ext = info.mime === 'image/png' ? 'png' : 'jpg';
    const file = join(OUT, 'img', `${spec.id}.${ext}`);
    const ok = await download(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image)}?width=1200`, file);
    if (ok) { photo = { file: `${spec.id}.${ext}`, source: image, ...info }; break; }
  }
  if (!photo) problems.push(`${spec.id}: sin foto${ent ? ` (${ent.id}${rejected.length ? '; ' + rejected.join(' / ') : ': sin P18'})` : ' (no se encontró la entidad)'}`);
  const cty = countryAt(lon, lat);
  const region = cty ? (regionOf.get(cty.name) ?? null) : null;
  items.push({ id: `mon:${spec.id}`, spec, lat, lon, region, wikidata: ent?.id ?? null, how, photo });
  process.stdout.write(`${how === 'q' ? '·' : how === 'search' ? '~' : '?'}`);
}
console.log();
if (problems.length) console.log('Avisos:\n' + problems.map((p) => '  ' + p).join('\n'));

// ── Salidas ──────────────────────────────────────────────────────────────────
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const ts = `// Generado por scripts/build-landmarks.mjs a partir de landmarkTiers.ts + Wikidata. No editar a mano.
import type { City } from './cities';

/** Monumentos (Fase 6c): un ítem por sitio, con la forma de City (kind 'monument'). Se mide al punto. */
export const LANDMARK_ITEMS: City[] = [
${items.map((it) => `  { id: '${it.id}', kind: 'monument', name: ${q(it.spec.es)}, nameEn: ${q(it.spec.en)}, country: ${q(it.spec.country)}, city: ${q(it.spec.city)}, lat: ${it.lat}, lon: ${it.lon}, difficulty: '${it.spec.tier}', region: ${it.region ? `'${it.region}'` : 'null'}, photo: ${it.photo ? 'true' : 'false'} },`).join('\n')}
];
`;
writeFileSync('src/data/landmarkCatalog.ts', ts);

writeFileSync(join(OUT, 'meta.json'), JSON.stringify(items.map((it) => ({ id: it.spec.id, es: it.spec.es, wikidata: it.wikidata, photo: it.photo })), null, 1));

const esc = (s) => String(s).replace(/'/g, "''");
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/landmark_places.sql', `-- Generado por scripts/build-landmarks.mjs (monumentos, Fase 6c). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${items.map((it) => `  ('${it.id}', 'monument', '${esc(it.spec.es)}', '${esc(it.spec.country)}', ${it.lat}, ${it.lon})`).join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;
`);

const TIER = { basic: 'Turista', easy: 'Rookie', medium: 'Crack', hard: 'Leyenda' };
const TIERS = ['basic', 'easy', 'medium', 'hard'];
const REG = { americas: 'América', europe: 'Europa', asia: 'Asia', africa: 'África', oceania: 'Oceanía (solo en Mundo)' };
const regKey = (it) => it.region ?? 'oceania';
let doc = `# Fase 6c · Monumentos — catálogo para revisión

Borrador (2026-10-23), ${items.length} monumentos y sitios. Para cambiar algo: editar \`src/data/landmarkTiers.ts\` y correr
\`node scripts/build-landmarks.mjs --out <carpeta>\` + \`python scripts/convert-landmarks.py <carpeta>\` (regeneran el catálogo,
las fotos en \`public/landmarks\`, \`credits.json\` y \`supabase/seed/landmark_places.sql\`).

Niveles por lo conocido que es el sitio para un jugador latinoamericano: **Turista** · **Rookie** · **Crack** · **Leyenda**.
Se mide al punto, como una ciudad. Las fotos son la imagen principal de cada sitio en Wikidata (Wikimedia Commons, licencias
libres; el autor y la licencia se muestran en Soporte). Para cambiar una foto: poner otra imagen de Commons como P18 no es
nuestro; en la spec se puede fijar \`q\` a otra entidad o dejar el sitio sin foto (se muestra solo el nombre).

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
    const c = items.filter((it) => regKey(it) === r && it.spec.tier === t).sort((a, b) => a.spec.es.localeCompare(b.spec.es, 'es'));
    if (!c.length) continue;
    doc += `- **${TIER[t]}** (${c.length}):\n`;
    for (const it of c) doc += `  - ${it.spec.es} — ${it.spec.city}, ${it.spec.country}${it.photo ? ` · foto ${it.photo.license} (${it.photo.author.slice(0, 40)}) · [Commons](${it.photo.url})` : ' · **sin foto**'}\n`;
  }
  doc += '\n';
}
const lic = {};
for (const it of items) { const k = it.photo ? it.photo.license : 'sin foto'; lic[k] = (lic[k] ?? 0) + 1; }
doc += `## Licencias de las fotos\n\n${Object.entries(lic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`;
writeFileSync('docs/Fase6_Monumentos_catalogo.md', doc);

const count = (fn) => items.reduce((mm, it) => { const k = fn(it); mm[k] = (mm[k] ?? 0) + 1; return mm; }, {});
console.log(`monumentos ${items.length}`, count((it) => it.spec.tier), count(regKey), `con foto ${items.filter((it) => it.photo).length}`, lic);

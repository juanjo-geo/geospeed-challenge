/**
 * Fichas de los lugares (Fase 8): cifras de Wikidata (CC0) para cada elemento del juego y los lugares importantes
 * cercanos, sacados del propio catálogo.
 *
 * Escribe:
 *  1) src/data/placeFacts.json — { [id]: { q, pop?, popY?, area?, elev?, len?, h?, cap?: [es, en], lang?: [[es, en]…],
 *     since?: [año, precisión], unesco?: 1, cult?: [es, en], style?: [es, en], near?: [ids] } }. Se carga aparte
 *     (src/lib/placeFacts.ts) al empezar una partida, para la franja del acierto y la ficha.
 *  2) src/data/placeTrivia.json — { [id]: [es, en] } con los datos curiosos (si se pasa --trivia <archivo JSON con
 *     { [id]: { es, en } }>). Los municipios del pack Colombia que también son ciudades del mundo usan el mismo texto.
 *  3) docs/Fase8_Fichas_catalogo.md — todo junto por categoría, con el enlace a Wikidata de cada elemento, para revisión.
 *
 * El id de Wikidata sale de Natural Earth cuando lo trae (ciudades, divisiones, lagos, mares, regiones), del id ya
 * conocido (monumentos con `q`) o de la búsqueda de Wikidata con comprobación de distancia y país. Las cifras vienen
 * de la Wikidata Query Service con el valor de mejor rango (y el más reciente, en habitantes) y las unidades
 * normalizadas por Wikidata (m, m²). QID_OVERRIDES corrige a mano lo que la revisión encuentre mal.
 *
 * Uso: node scripts/build-facts.mjs --ne <carpeta Natural Earth> --out <carpeta de trabajo> [--trivia <archivo>]
 * (las respuestas de Wikidata se guardan en la carpeta de trabajo y no se vuelven a pedir)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const NE = arg('--ne');
const OUT = arg('--out');
const TRIVIA = arg('--trivia');
if (!NE || !existsSync(NE) || !OUT) { console.error('Uso: node scripts/build-facts.mjs --ne <Natural Earth> --out <trabajo> [--trivia <archivo>]'); process.exit(1); }
mkdirSync(join(OUT, 'cache'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ids de Wikidata corregidos a mano (id del juego → Q…), o null para dejar el elemento sin cifras */
const QID_OVERRIDES = {
  'mon:san-basilio': 'Q129846',
  'feat:denali': 'Q130018', 'feat:cervino': 'Q1374', 'feat:canarias': 'Q5813', 'feat:malvinas': 'Q9648',
  'feat:cordillera-central': 'Q143982', 'feat:krakatoa': 'Q82613',
  // la búsqueda por nombre daba las cordilleras de Perú y un pueblo de Eritrea
  'feat:cordillera-occidental': 'Q278057', 'feat:cordillera-oriental': 'Q143014', 'feat:sahel': 'Q66065',
  'mon:palenque': 'Q181427', 'mon:tulum': 'Q725883', // eran los municipios, no las ruinas
  'ci:mx-tlaxcala': 'Q689987', 'ci:mx-mazatlan': 'Q40194', 'co:san-agustin': null,
  'ci:py-general-eugenio-alejandrino-garay': 'Q2409529',
  'div:pa-comarca-ngabe-bugle': 'Q1129783', 'div:cr-puntarenas': 'Q502170', 'div:do-la-estrelleta': 'Q1137545',
};

// ── Catálogo (TS → JS con esbuild) ───────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-facts-'));
const entry = join(tmp, 'entry.ts');
writeFileSync(entry, `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { FLAG_ITEMS } from '@/data/flagCatalog';
export { FEATURE_ITEMS } from '@/data/featureCatalog';
export { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
export { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
export { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from '@/data/proPackCatalog';
export { FEATURES } from '@/data/featureTiers';
export { LANDMARKS } from '@/data/landmarkTiers';
export { shapeDistance, haversineKm } from '@/lib/flagScoring';
export { countryIso } from '@/lib/flags';
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: join(tmp, 'entry.js'), alias: { '@': resolve('src') }, logLevel: 'warning' });
const C = await import(pathToFileURL(join(tmp, 'entry.js')).href);
const { shapeDistance, haversineKm, countryIso } = C;
const featureShapes = JSON.parse(read('src/data/featureShapes.json'));
const divShapes = { ...JSON.parse(read('src/data/packShapes.json')), ...JSON.parse(read('src/data/proPackShapes.json')) };

const seenCity = new Set();
const WORLD = [...C.worldCities, ...C.europeCities, ...C.asiaCities, ...C.americasCities, ...C.africaCities]
  .filter((c) => (seenCity.has(c.id) ? false : (seenCity.add(c.id), true)));
const GROUPS = [
  { key: 'world', title: 'Ciudades del mundo', items: WORLD, kind: 'city' },
  { key: 'flags', title: 'Países (banderas)', items: C.FLAG_ITEMS, kind: 'country' },
  { key: 'features', title: 'Lugares geográficos', items: C.FEATURE_ITEMS, kind: 'feature' },
  { key: 'landmarks', title: 'Monumentos', items: C.LANDMARK_ITEMS, kind: 'monument' },
  { key: 'coCities', title: 'Pack Colombia: municipios', items: C.COLOMBIA_CITIES, kind: 'city' },
  { key: 'coDivs', title: 'Pack Colombia: departamentos', items: C.COLOMBIA_DIVISIONS, kind: 'division' },
  { key: 'proCities', title: 'Packs Pro: ciudades', items: C.PRO_PACK_CITIES, kind: 'city' },
  { key: 'proDivs', title: 'Packs Pro: estados y provincias', items: C.PRO_PACK_DIVISIONS, kind: 'division' },
];
const ALL = GROUPS.flatMap((g) => g.items.map((it) => ({ it, g })));
const featSpec = new Map(C.FEATURES.map((s) => [`feat:${s.id}`, s]));
const monSpec = new Map(C.LANDMARKS.map((s) => [`mon:${s.id}`, s]));

// ── Utilidades ───────────────────────────────────────────────────────────────
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polysOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const inGeometry = (g, lon, lat) => polysOf(g).some((poly) => pointInRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => pointInRing(lon, lat, h)));
const cacheFile = (key) => join(OUT, 'cache', key.replace(/[^a-z0-9_-]/gi, '_').slice(0, 80) + '_' + createHash('md5').update(key).digest('hex').slice(0, 10) + '.json');

async function getJson(url, key, init) {
  const f = cacheFile(key);
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init?.headers ?? {}) } });
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(250); return j; }
    if (res.status === 429 || res.status >= 500) { await sleep(3000 * (attempt + 1)); continue; }
    throw new Error(`${res.status} ${url.slice(0, 200)}`);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 200)}`);
}
const WD = 'https://www.wikidata.org/w/api.php';
const SPARQL = 'https://query.wikidata.org/sparql';
const sparql = (query) => getJson(SPARQL, `sparql_${createHash('md5').update(query).digest('hex')}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
  body: new URLSearchParams({ query, format: 'json' }).toString(),
}).then((j) => j.results.bindings);
const qOf = (uri) => uri?.value?.split('/').pop();
const search = async (text, lang) => (await getJson(`${WD}?action=wbsearchentities&search=${encodeURIComponent(text)}&language=${lang}&uselang=${lang}&type=item&limit=8&format=json`, `search_${lang}_${text}`)).search?.map((x) => x.id) ?? [];
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

/** Coordenadas, países (ISO) y clases de unos candidatos de Wikidata */
const verifyCache = new Map();
async function verify(qids) {
  const todo = qids.filter((q) => !verifyCache.has(q));
  for (const part of chunks(todo, 80)) {
    for (const q of part) verifyCache.set(q, { coords: [], isos: new Set(), cls: new Set() });
    const rows = await sparql(`SELECT ?item ?coord ?ciso ?cls WHERE { VALUES ?item { ${part.map((q) => `wd:${q}`).join(' ')} }
      OPTIONAL { ?item wdt:P625 ?coord } OPTIONAL { ?item wdt:P17 ?c . ?c wdt:P297 ?ciso } OPTIONAL { ?item wdt:P31 ?cls } }`);
    for (const r of rows) {
      const v = verifyCache.get(qOf(r.item));
      const m = r.coord?.value?.match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/);
      if (m) v.coords.push([+m[2], +m[1]]);
      if (r.ciso) v.isos.add(r.ciso.value);
      if (r.cls) v.cls.add(qOf(r.cls));
    }
  }
  return qids.map((q) => [q, verifyCache.get(q)]);
}
const BAD_CLASSES = new Set(['Q4167410', 'Q5', 'Q13442814', 'Q4167836', 'Q11266439', 'Q17633526']);
const minKm = (v, lat, lon) => Math.min(Infinity, ...v.coords.map(([a, b]) => haversineKm(a, b, lat, lon)));

/** Primer resultado de la búsqueda que pasa la prueba (en el orden de Wikidata, que pone primero lo más conocido) */
async function searchPick(texts, ok) {
  for (const [text, lang] of texts) {
    if (!text) continue;
    const ids = await search(text, lang);
    if (!ids.length) continue;
    for (const [q, v] of await verify(ids)) if (![...v.cls].some((c) => BAD_CLASSES.has(c)) && ok(v)) return q;
  }
  return null;
}

// ── Natural Earth ────────────────────────────────────────────────────────────
const neCache = new Map();
const ne = (file) => {
  if (!neCache.has(file)) neCache.set(file, JSON.parse(read(join(NE, `${file}.geojson`))).features);
  return neCache.get(file);
};
const wikiOf = (p) => p.wikidataid || p.WIKIDATAID || null;
const placeNames = (p) => [p.NAME, p.NAMEASCII, p.NAME_ES, p.NAME_EN, ...(p.NAMEALT ? String(p.NAMEALT).split('|') : [])].filter(Boolean).map(norm);
function nePlace(it, isoSet, maxKm) {
  const n = norm(it.name);
  let best = null;
  for (const ft of ne('ne_10m_populated_places')) {
    const p = ft.properties;
    if (isoSet && !isoSet.has(p.ISO_A2)) continue;
    const km = haversineKm(p.LATITUDE, p.LONGITUDE, it.lat, it.lon);
    if (km > maxKm) continue;
    const names = placeNames(p);
    const named = names.some((x) => x === n || (x.length > 3 && (x.includes(n) || n.includes(x))));
    if (!named && km > 3) continue;
    const score = km - (named ? 50 : 0);
    if (!best || score < best.score) best = { score, q: wikiOf(p), pop: p.POP_MAX };
  }
  return best;
}
function neDivision(it) {
  const iso = it.id.slice(4, 6).toUpperCase();
  for (const ft of ne('ne_10m_admin_1_states_provinces')) {
    const p = ft.properties;
    if (p.iso_a2 !== iso) continue;
    if (inGeometry(ft.geometry, it.lon, it.lat)) return wikiOf(p);
  }
  const n = norm(it.name);
  const hit = ne('ne_10m_admin_1_states_provinces').find((ft) => ft.properties.iso_a2 === iso && [ft.properties.name, ft.properties.name_es, ft.properties.name_en].some((x) => norm(x) === n));
  return hit ? wikiOf(hit.properties) : null;
}
const FEAT_FILES = { rivers: 'ne_50m_rivers_lake_centerlines', rivers10: 'ne_10m_rivers_lake_centerlines', lakes: 'ne_50m_lakes', lakes10: 'ne_10m_lakes', marine: 'ne_10m_geography_marine_polys', regions: 'ne_10m_geography_regions_polys', points: 'ne_10m_geography_regions_points' };
const inBBox = (g, [x0, y0, x1, y1]) => {
  let hit = false;
  const walk = (c) => { if (typeof c[0] === 'number') { if (c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1) hit = true; } else c.forEach(walk); };
  walk(g.coordinates);
  return hit;
};
function neFeature(spec) {
  const s = spec?.ne;
  if (!s || !FEAT_FILES[s.ds]) return null;
  const names = [].concat(s.name).map(norm);
  let found = ne(FEAT_FILES[s.ds]).filter((ft) => [ft.properties.name, ft.properties.NAME, ft.properties.name_en, ft.properties.NAME_EN].filter(Boolean).map(norm).some((x) => names.includes(x)));
  if (s.bbox) found = found.filter((ft) => inBBox(ft.geometry, s.bbox));
  return found.map((ft) => wikiOf(ft.properties)).find(Boolean) ?? null;
}

// ── 1) Ids de Wikidata ───────────────────────────────────────────────────────
const qidFile = join(OUT, 'qids.json');
const qids = existsSync(qidFile) ? JSON.parse(read(qidFile)) : {};
const source = {};
const ISO_SETS = { coCities: new Set(['CO']) };

// Países por ISO-3166 (P297), descartando entidades disueltas
const isoRows = await sparql(`SELECT ?item ?iso ?cls WHERE { ?item wdt:P297 ?iso . FILTER NOT EXISTS { ?item wdt:P576 [] } OPTIONAL { ?item wdt:P31 ?cls } }`);
const STATE = new Set(['Q6256', 'Q3624078', 'Q15634554', 'Q7275', 'Q1763527']);
const byIso = new Map();
for (const r of isoRows) {
  const iso = r.iso.value, q = qOf(r.item), isState = STATE.has(qOf(r.cls));
  const cur = byIso.get(iso);
  if (!cur || (isState && !cur.isState)) byIso.set(iso, { q, isState });
}

let done = 0;
for (const { it, g } of ALL) {
  if (it.id in QID_OVERRIDES) { qids[it.id] = QID_OVERRIDES[it.id]; source[it.id] = 'manual'; continue; }
  if (qids[it.id] !== undefined) { source[it.id] = 'caché'; continue; }
  let q = null, src = null;
  if (g.key === 'flags') { q = byIso.get(it.iso)?.q ?? null; src = 'ISO'; }
  else if (g.key === 'world' || g.key === 'coCities' || g.key === 'proCities') {
    const isoSet = ISO_SETS[g.key] ?? (g.key === 'world' ? (countryIso(it.country) ? new Set([countryIso(it.country)]) : null) : null);
    const hit = nePlace(it, isoSet, g.key === 'proCities' ? 5 : 25);
    if (hit?.q) { q = hit.q; src = 'Natural Earth'; }
    else {
      q = await searchPick([[it.name, 'es'], [`${it.name} ${it.country}`, 'es'], [it.name, 'en']], (v) => minKm(v, it.lat, it.lon) <= 30 && (!isoSet || [...v.isos].some((i) => isoSet.has(i))));
      src = 'búsqueda';
    }
  } else if (g.kind === 'division') { q = neDivision(it); src = 'Natural Earth'; }
  else if (g.key === 'features') {
    q = neFeature(featSpec.get(it.id)); src = 'Natural Earth';
    if (!q) {
      const far = it.geom === 'point' ? 60 : 1500;
      const isos = new Set(it.isos ?? []);
      q = await searchPick([[it.nameEn, 'en'], [it.name, 'es']], (v) => minKm(v, it.lat, it.lon) <= far || (it.geom !== 'point' && [...v.isos].some((i) => isos.has(i))));
      src = 'búsqueda';
    }
  } else if (g.key === 'landmarks') {
    q = monSpec.get(it.id)?.q ?? null; src = 'spec';
    if (!q) { q = await searchPick([[it.nameEn, 'en'], [it.nameEn?.replace(/\s*\(.*\)$/, ''), 'en'], [it.name, 'es']], (v) => minKm(v, it.lat, it.lon) <= 30); src = 'búsqueda'; }
  }
  qids[it.id] = q;
  source[it.id] = q ? src : '—';
  if (++done % 50 === 0) { writeFileSync(qidFile, JSON.stringify(qids, null, 1)); process.stdout.write(`${done} `); }
}
writeFileSync(qidFile, JSON.stringify(qids, null, 1));
console.log(`\nids: ${Object.values(qids).filter(Boolean).length}/${ALL.length}`);

// ── 2) Cifras (Wikidata Query Service) ───────────────────────────────────────
const allQ = [...new Set(Object.values(qids).filter(Boolean))];
const data = new Map(allQ.map((q) => [q, {}]));
const vals = (part) => part.map((q) => `wd:${q}`).join(' ');
const yearOf = (t) => (t ? parseInt(t.value.slice(0, t.value.indexOf('-', 1)), 10) : null);
const RANK = { PreferredRank: 2, NormalRank: 1 };
const rankOf = (r) => RANK[qOf(r.rank)] ?? 0;
const labelPair = (r, es = 'es', en = 'en') => [r[es]?.value ?? r[en]?.value ?? null, r[en]?.value ?? r[es]?.value ?? null];

for (const part of chunks(allQ, 150)) {
  // Habitantes: mejor rango y, entre iguales, el más reciente
  for (const r of await sparql(`SELECT ?item ?v ?rank ?t WHERE { VALUES ?item { ${vals(part)} } ?item p:P1082 ?st . ?st ps:P1082 ?v ; wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank) OPTIONAL { ?st pq:P585 ?t } }`)) {
    const d = data.get(qOf(r.item)); const cand = { v: +r.v.value, rank: rankOf(r), y: yearOf(r.t) ?? -9999 };
    if (!d._pop || cand.rank > d._pop.rank || (cand.rank === d._pop.rank && cand.y > d._pop.y)) d._pop = cand;
  }
  // Cantidades normalizadas por Wikidata (m², m)
  for (const [p, key] of [['P2046', 'area'], ['P2044', 'elev'], ['P2043', 'len'], ['P2048', 'h']]) {
    for (const r of await sparql(`SELECT ?item ?v ?rank WHERE { VALUES ?item { ${vals(part)} } ?item p:${p} ?st . ?st psn:${p}/wikibase:quantityAmount ?v ; wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank) }`)) {
      const d = data.get(qOf(r.item)); const cand = { v: +r.v.value, rank: rankOf(r) };
      if (!d[`_${key}`] || cand.rank > d[`_${key}`].rank || (cand.rank === d[`_${key}`].rank && cand.v > d[`_${key}`].v)) d[`_${key}`] = cand;
    }
  }
  // Fecha de construcción o fundación
  for (const r of await sparql(`SELECT ?item ?t ?prec ?rank WHERE { VALUES ?item { ${vals(part)} } ?item p:P571 ?st . ?st psv:P571 [ wikibase:timeValue ?t ; wikibase:timePrecision ?prec ] ; wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank) }`)) {
    const d = data.get(qOf(r.item)); const v = r.t.value; const y = parseInt(v.slice(0, v.indexOf('-', 1)), 10);
    const cand = { y, prec: +r.prec.value, rank: rankOf(r) };
    if (!d._since || cand.rank > d._since.rank || (cand.rank === d._since.rank && cand.y < d._since.y)) d._since = cand;
  }
  // Valores que son otros elementos (con su nombre en español e inglés)
  for (const [p, key, max] of [['P36', 'cap', 1], ['P37', 'lang', 3], ['P2596', 'cult', 1], ['P149', 'style', 1]]) {
    for (const r of await sparql(`SELECT ?item ?val ?es ?en WHERE { VALUES ?item { ${vals(part)} } ?item wdt:${p} ?val . OPTIONAL { ?val rdfs:label ?es FILTER(lang(?es) = 'es') } OPTIONAL { ?val rdfs:label ?en FILTER(lang(?en) = 'en') } }`)) {
      const d = data.get(qOf(r.item)); const pair = labelPair(r);
      if (!pair[0]) continue;
      d[key] = d[key] ?? [];
      if (d[key].length < max && !d[key].some((x) => x[1] === pair[1])) d[key].push(pair);
    }
  }
  // Patrimonio de la Humanidad: propio o del conjunto del que forma parte
  for (const r of await sparql(`SELECT DISTINCT ?item WHERE { VALUES ?item { ${vals(part)} } { ?item wdt:P757 [] } UNION { ?item wdt:P1435 wd:Q9259 } UNION { ?item wdt:P361 ?whole . ?whole wdt:P757 [] } }`)) data.get(qOf(r.item)).unesco = 1;
  // Nombre en Wikidata (solo para la revisión)
  for (const r of await sparql(`SELECT ?item ?es ?en WHERE { VALUES ?item { ${vals(part)} } OPTIONAL { ?item rdfs:label ?es FILTER(lang(?es) = 'es') } OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en) = 'en') } }`)) data.get(qOf(r.item)).label = labelPair(r);
  process.stdout.write('·');
}
console.log();

// ── 3) Lugares importantes cercanos (del catálogo) ───────────────────────────
const LANDMARKS_ALL = C.LANDMARK_ITEMS;
const FEATS_ALL = C.FEATURE_ITEMS;
const tierRank = { basic: 0, easy: 1, medium: 2, hard: 3 };
const featKm = (f, lat, lon) => {
  const sh = featureShapes[f.id];
  if (!sh) return haversineKm(f.lat, f.lon, lat, lon);
  return shapeDistance(sh.rings, lat, lon, !sh.line)?.km ?? haversineKm(f.lat, f.lon, lat, lon);
};
function nearPoint(it, { monKm, featKm: fKm, max = 3, maxMon = 2 }) {
  const mons = LANDMARKS_ALL.filter((m) => m.id !== it.id).map((m) => ({ id: m.id, km: haversineKm(m.lat, m.lon, it.lat, it.lon), t: tierRank[m.difficulty] }))
    .filter((m) => m.km <= monKm).sort((a, b) => a.t - b.t || a.km - b.km).slice(0, maxMon);
  const feats = FEATS_ALL.filter((f) => f.id !== it.id && Math.abs(f.lat - it.lat) < 25).map((f) => ({ id: f.id, km: featKm(f, it.lat, it.lon), t: tierRank[f.difficulty] }))
    .filter((f) => f.km <= fKm).sort((a, b) => a.t - b.t || a.km - b.km);
  return [...mons, ...feats].slice(0, max).map((x) => x.id);
}
function nearCountry(it) {
  const iso = it.iso;
  const mons = LANDMARKS_ALL.filter((m) => countryIso(m.country) === iso && !m.packOnly).sort((a, b) => tierRank[a.difficulty] - tierRank[b.difficulty]).slice(0, 2);
  const feats = FEATS_ALL.filter((f) => f.isos?.[0] === iso && !f.packOnly).sort((a, b) => tierRank[a.difficulty] - tierRank[b.difficulty]);
  return [...mons, ...feats].slice(0, 3).map((x) => x.id);
}
const PACK_CITIES = [...C.COLOMBIA_CITIES, ...C.PRO_PACK_CITIES];
function nearDivision(it) {
  const sh = divShapes[it.id];
  if (!sh) return [];
  const inside = (lat, lon) => sh.rings.some((r) => pointInRing(lon, lat, r));
  const mons = LANDMARKS_ALL.filter((m) => inside(m.lat, m.lon)).sort((a, b) => tierRank[a.difficulty] - tierRank[b.difficulty]).slice(0, 2);
  const feats = FEATS_ALL.filter((f) => f.geom === 'point' && inside(f.lat, f.lon)).sort((a, b) => tierRank[a.difficulty] - tierRank[b.difficulty]).slice(0, 2);
  const cities = PACK_CITIES.filter((c) => c.name !== it.capital && inside(c.lat, c.lon))
    .sort((a, b) => tierRank[a.difficulty] - tierRank[b.difficulty]);
  return [...mons, ...feats, ...cities].slice(0, 3).map((x) => x.id);
}

// ── 4) Salida ────────────────────────────────────────────────────────────────
const round = (v, d = 0) => (v == null || !isFinite(v) ? undefined : Math.round(v * 10 ** d) / 10 ** d);
const facts = {};
const notes = [];
for (const { it, g } of ALL) {
  const q = qids[it.id];
  const d = q ? data.get(q) : null;
  const f = q ? { q } : {};
  if (d) {
    if (d._pop && d._pop.v > 0) { f.pop = Math.round(d._pop.v); if (d._pop.y > 1800) f.popY = d._pop.y; }
    if (d._area && d._area.v > 0) f.area = round(d._area.v / 1e6, d._area.v < 1e7 ? 1 : 0);
    if (d._elev) f.elev = Math.round(d._elev.v);
    if (d._len && d._len.v > 0) f.len = round(d._len.v / 1000, d._len.v < 1e5 ? 1 : 0);
    if (d._h && d._h.v > 0) f.h = round(d._h.v, 1);
    if (d._since && g.kind !== 'country') f.since = [d._since.y, d._since.prec];
    if (d.cap) f.cap = d.cap[0];
    if (d.lang) f.lang = d.lang;
    if (d.cult) f.cult = d.cult[0];
    if (d.style) f.style = d.style[0];
    if (d.unesco && (g.kind === 'monument' || g.kind === 'feature')) f.unesco = 1;
  }
  // Solo lo que la ficha de cada categoría usa (el resto de Wikidata queda fuera del JSON)
  if (g.kind === 'city') { delete f.len; delete f.h; delete f.cult; delete f.style; delete f.lang; delete f.cap; delete f.since; }
  if (g.kind === 'country') { delete f.elev; delete f.len; delete f.h; delete f.cult; delete f.style; }
  if (g.kind === 'division') { delete f.len; delete f.h; delete f.cult; delete f.style; delete f.lang; delete f.since; delete f.elev; delete f.cap; }
  if (g.kind === 'feature') { delete f.pop; delete f.popY; delete f.cap; delete f.lang; delete f.cult; delete f.style; delete f.since;
    if (it.geom === 'line') delete f.area; if (it.ftype !== 'waterfall') delete f.h; if (!['peak', 'volcano', 'plateau', 'paramo'].includes(it.ftype)) delete f.elev; }
  if (g.kind === 'monument') { delete f.pop; delete f.popY; delete f.area; delete f.elev; delete f.len; delete f.lang; delete f.cap; }
  const near = g.kind === 'country' ? nearCountry(it)
    : g.kind === 'division' ? nearDivision(it)
    : g.kind === 'monument' ? nearPoint(it, { monKm: 25, featKm: 8, max: 2, maxMon: 2 })
    : g.kind === 'city' ? nearPoint(it, { monKm: g.key === 'world' ? 60 : 35, featKm: g.key === 'world' ? 15 : 8 })
    : [];
  if (near.length) f.near = near;
  facts[it.id] = f;
  if (!q) notes.push(`${g.title}: ${it.name} sin id de Wikidata`);
}
writeFileSync('src/data/placeFacts.json', JSON.stringify(facts));
console.log(`placeFacts.json: ${Object.keys(facts).length} elementos, ${(JSON.stringify(facts).length / 1024).toFixed(0)} KB`);

// Datos curiosos revisados
let trivia = {};
if (TRIVIA) {
  const raw = JSON.parse(read(TRIVIA));
  const worldByName = new Map(WORLD.filter((c) => c.country === 'Colombia').map((c) => [c.name, c.id]));
  for (const { it } of ALL) {
    const t = raw[it.id] ?? (it.id.startsWith('co:') && worldByName.has(it.name) ? raw[worldByName.get(it.name)] : null);
    if (t?.es && t?.en) trivia[it.id] = [t.es.trim(), t.en.trim()];
  }
  writeFileSync('src/data/placeTrivia.json', JSON.stringify(trivia));
  console.log(`placeTrivia.json: ${Object.keys(trivia).length} datos curiosos, ${(JSON.stringify(trivia).length / 1024).toFixed(0)} KB`);
}

// Documento de revisión
const fmt = (n) => (n == null ? '' : Math.round(n).toLocaleString('es-CO'));
const nameOf = new Map([...ALL.map(({ it }) => [it.id, it.name])]);
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
const sinceTxt = (s) => (!s ? '' : s[1] >= 9 ? `${s[0] < 0 ? `${-s[0]} a. C.` : s[0]}` : s[1] === 8 ? `década de ${s[0]}` : s[1] === 7 ? `siglo ${Math.ceil(Math.abs(s[0]) / 100)}${s[0] < 0 ? ' a. C.' : ''}` : `${s[0]}`);
let md = `# Fase 8 — Fichas de los lugares (revisión)

Generado por \`scripts/build-facts.mjs\`. Cifras de **Wikidata** (CC0, valor de mejor rango; habitantes = el dato más
reciente) y "Cerca" calculado con el propio catálogo. Los datos curiosos los escribió Claude y **están pendientes de
revisión**: si alguno está mal, se corrige en el JSON de datos curiosos y se vuelve a generar.

- Si un elemento quedó con el id de Wikidata equivocado (cifras absurdas, otro lugar), se corrige en \`QID_OVERRIDES\`
  del script (o \`null\` para dejarlo sin cifras).
- Columnas: id de Wikidata (enlace) · nombre que tiene en Wikidata · cifras · lugares cercanos · dato curioso (ES).

`;
for (const g of GROUPS) {
  md += `\n## ${g.title} (${g.items.length})\n\n| Lugar | Wikidata | Cifras | Cerca | Dato curioso |\n|---|---|---|---|---|\n`;
  for (const it of g.items) {
    const f = facts[it.id] ?? {};
    const d = f.q ? data.get(f.q) : null;
    const nums = [
      f.pop != null && `${fmt(f.pop)} hab.${f.popY ? ` (${f.popY})` : ''}`,
      f.area != null && `${fmt(f.area)} km²`,
      f.elev != null && `${fmt(f.elev)} m`,
      f.len != null && `${fmt(f.len)} km`,
      f.h != null && `${fmt(f.h)} m de caída`,
      f.cap && `capital ${f.cap[0]}`,
      f.lang && `idioma ${f.lang.map((x) => x[0]).join(', ')}`,
      f.since && `desde ${sinceTxt(f.since)}`,
      f.cult && `cultura ${f.cult[0]}`,
      f.style && `estilo ${f.style[0]}`,
      f.unesco && 'UNESCO',
    ].filter(Boolean).join(' · ');
    const wd = f.q ? `[${f.q}](https://www.wikidata.org/wiki/${f.q})` : '—';
    md += `| ${cell(it.name)} | ${wd} ${cell(d?.label?.[0] ?? '')} | ${cell(nums)} | ${cell((f.near ?? []).map((id) => nameOf.get(id)).join(', '))} | ${cell(trivia[it.id]?.[0] ?? '')} |\n`;
  }
}
if (notes.length) md += `\n## Sin id de Wikidata (${notes.length})\n\n${notes.map((n) => `- ${n}`).join('\n')}\n`;
writeFileSync('docs/Fase8_Fichas_catalogo.md', md);
const bySrc = Object.values(source).reduce((m, s) => ((m[s] = (m[s] ?? 0) + 1), m), {});
console.log('origen de los ids:', bySrc);

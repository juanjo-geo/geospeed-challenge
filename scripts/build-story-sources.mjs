/**
 * Fuentes para escribir la reseña de cada lugar (bloque R3, docs/GeoSpeed_Resena_Lugar_Diseno.md): para los 1.281
 * lugares del mundo y del pack Colombia (los que tienen dato curioso), el resumen del artículo de Wikipedia en español
 * (o en inglés si no hay) y las frases del artículo que hablan de qué ver, comer o celebrar. Con eso se redactan los
 * dos párrafos ("Lo curioso" y "Para conocer") con palabras propias y sin inventar datos. Las fuentes se quedan en la
 * carpeta de trabajo: no van al juego.
 *
 * Escribe <trabajo>/sources/<grupo>-<n>.json (tandas de 40 lugares) con, por lugar: id, nombre ES/EN, tipo, país o
 * región, cifras de la ficha (para no repetirlas), dato curioso (para no repetirlo), lugares cercanos del catálogo,
 * resumen, frases de "qué ver" y el artículo de Wikipedia (para el enlace "Basado en Wikipedia").
 *
 * Uso: node scripts/build-story-sources.mjs --out <trabajo> [--cache <carpeta con la caché de Wikidata>]
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg('--out');
if (!OUT) { console.error('Uso: node scripts/build-story-sources.mjs --out <trabajo>'); process.exit(1); }
const CACHE = arg('--cache') ?? join(OUT, 'cache');
mkdirSync(CACHE, { recursive: true });
mkdirSync(join(OUT, 'sources'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH = 40;

const cacheFile = (key) => join(CACHE, key.replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) + '_' + createHash('md5').update(key).digest('hex').slice(0, 12) + '.json');
async function getJson(url, key) {
  const f = cacheFile(key);
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }); } catch { await sleep(3000 * 2 ** attempt); continue; }
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(120); return j; }
    if (res.status === 404) { writeFileSync(f, 'null'); return null; }
    if (res.status === 429 || res.status >= 500) { const s = Number(res.headers.get('retry-after')); await sleep(Number.isFinite(s) && s > 0 ? Math.min(s, 120) * 1000 : 3000 * 2 ** attempt); continue; }
    throw new Error(`${res.status} ${url.slice(0, 200)}`);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 200)}`);
}
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

// ── Catálogo ─────────────────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-stories-'));
const entry = join(tmp, 'entry.ts');
writeFileSync(entry, `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { FLAG_ITEMS } from '@/data/flagCatalog';
export { FEATURE_ITEMS } from '@/data/featureCatalog';
export { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
export { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: join(tmp, 'entry.js'), alias: { '@': resolve('src') }, logLevel: 'warning', loader: { '.json': 'json' } });
const C = await import(pathToFileURL(join(tmp, 'entry.js')).href);
const byId = new Map();
for (const list of [C.worldCities, C.europeCities, C.asiaCities, C.americasCities, C.africaCities, C.FLAG_ITEMS, C.FEATURE_ITEMS, C.LANDMARK_ITEMS, C.COLOMBIA_CITIES, C.COLOMBIA_DIVISIONS]) {
  for (const it of list) if (it.id && !byId.has(it.id)) byId.set(it.id, it);
}
const facts = JSON.parse(read('src/data/placeFacts.json'));
const trivia = JSON.parse(read('src/data/placeTrivia.json'));
const groupOf = (id) => (id.startsWith('flag:') ? 'flags' : id.startsWith('feat:') ? 'features' : id.startsWith('mon:') ? 'monuments' : id.startsWith('co:') || id.startsWith('div:co-') ? 'colombia' : 'cities');
const KIND_ES = { flags: 'país', features: 'lugar geográfico', monuments: 'monumento', colombia: 'municipio o departamento de Colombia', cities: 'ciudad' };
const regionName = (iso) => { try { return new Intl.DisplayNames(['es'], { type: 'region' }).of(iso) ?? iso; } catch { return iso; } };

/** Cifras de la ficha en texto (para que la reseña no las repita) */
function figures(f) {
  if (!f) return [];
  const out = [];
  if (f.pop) out.push(`habitantes ≈ ${f.pop}`);
  if (f.area) out.push(`área ${f.area} km²`);
  if (f.elev) out.push(`altitud ${f.elev} m`);
  if (f.len) out.push(`largo ${f.len} km`);
  if (f.h) out.push(`altura/caída ${f.h} m`);
  if (f.cap) out.push(`capital ${f.cap[0]}`);
  if (f.since) out.push(`fundación/construcción ${f.since[0]}`);
  if (f.unesco) out.push('Patrimonio de la Humanidad');
  return out;
}

const items = Object.keys(trivia).map((id) => {
  const c = byId.get(id);
  return {
    id, group: groupOf(id), q: facts[id]?.q ?? null,
    name: c?.name ?? id, nameEn: c?.nameEn ?? null,
    kind: c?.kind === 'feature' ? `${KIND_ES.features} (${c.ftype})` : KIND_ES[groupOf(id)],
    where: c?.kind === 'flag' ? null : c?.kind === 'feature' ? (c.isos ?? []).map(regionName).join(', ') : [c?.city, c?.admin, c?.country].filter(Boolean).join(', '),
    figures: figures(facts[id]),
    trivia: trivia[id]?.[0] ?? null,
    near: (facts[id]?.near ?? []).map((n) => byId.get(n)?.name).filter(Boolean),
  };
});
console.log(`lugares: ${items.length}`);

// ── Wikidata: artículos ──────────────────────────────────────────────────────
/** Lugares sin artículo por Wikidata (sin q, o un q sin enlace a Wikipedia): el artículo se fija a mano */
const WP_TITLES = {
  'co:san-agustin': 'es:San Agustín (Huila)',
  'feat:ahaggar': 'es:Ahaggar',
  'feat:eyre': 'es:Lago Eyre',
  'feat:gorgona': 'es:Isla Gorgona',
  'feat:orizaba': 'es:Citlaltépetl',
  'feat:tayrona': 'es:Parque nacional natural Tayrona',
  'mon:bocachica': 'es:Isla Tierra Bomba', // no hay artículo propio; el de la isla describe el fuerte
  'mon:borobudur': 'es:Borobudur',
  'mon:prambanan': 'es:Prambanan',
};
const sitelinks = new Map();
const qids = [...new Set(items.map((i) => i.q).filter(Boolean))];
for (const batch of chunks(qids, 50)) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=sitelinks&sitefilter=eswiki|enwiki&format=json`;
  const j = await getJson(url, `wdsl_${createHash('md5').update(batch.join()).digest('hex')}`);
  for (const [q, e] of Object.entries(j?.entities ?? {})) sitelinks.set(q, { es: e.sitelinks?.eswiki?.title ?? null, en: e.sitelinks?.enwiki?.title ?? null });
}

// ── Wikipedia: resumen y frases de "qué ver" ─────────────────────────────────
const SIGHTS = /museo|catedral|iglesia|bas[ií]lica|templo|mezquita|santuario|palacio|castillo|fortaleza|fuerte|plaza|parque|jard[ií]n|playa|mercado|barrio|centro hist[oó]rico|casco antiguo|mirador|puente|torre|monumento|ruinas|arqueol[oó]g|patrimonio|tur[ií]s|visitant|gastronom|plato|comida|cocina|bebida|caf[eé]|fiesta|festival|carnaval|feria|tradici[oó]n|artesan|m[uú]sica|baile|danza|reserva|cascada|catarata|volc[aá]n|laguna|lago|sendero|isla|cueva|desierto|selva|bosque|fauna|flora|aves|ballena|excursi|paisaje|vista|nieve|esqu[ií]|buceo|surf/i;
const SIGHTS_EN = /museum|cathedral|church|basilica|temple|mosque|shrine|palace|castle|fortress|fort\b|square|park|garden|beach|market|district|old town|historic centre|historic center|viewpoint|bridge|tower|monument|ruins|archaeolog|heritage|touris|visitor|cuisine|dish|food|drink|coffee|festival|carnival|fair|tradition|craft|music|dance|reserve|waterfall|volcano|lake|trail|island|cave|desert|forest|wildlife|birds|whale|hik|landscape|view|snow|ski|diving|surf/i;
const AVOID = /guerra|conflicto|batalla|elecci[oó]n|partido pol[ií]tico|presidente|alcalde|gobernador|militar|ataque|atentado|violencia|narcotr|homicid|asesinat|terremoto|tragedia|masacre|desastre|\bwar\b|conflict|battle|election|president|mayor|governor|military|attack|violence|drug|homicide|murder|earthquake|tragedy|massacre|disaster/i;
const sentences = (text) => (text ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/u).filter((s) => s.length > 40 && s.length < 400);
function sights(text, re, max = 1100) {
  const out = [];
  let len = 0;
  for (const s of sentences(text)) {
    if (!re.test(s) || AVOID.test(s) || (s.match(/\d/g) ?? []).length > 12) continue;
    if (len + s.length > max) break;
    out.push(s); len += s.length;
  }
  return out.join(' ');
}
const summary = async (lang, title) => {
  const j = await getJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}?redirect=true`, `sum_${lang}_${title}`);
  return (j?.extract ?? '').trim();
};
const fullText = async (lang, title) => {
  const j = await getJson(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`, `ext_${lang}_${title}`);
  return j?.query?.pages?.[0]?.extract ?? '';
};

let n = 0;
const queue = [...items];
async function worker() {
  for (let it = queue.shift(); it; it = queue.shift()) {
    const fixed = WP_TITLES[it.id]?.match(/^(es|en):(.+)$/);
    const sl = fixed ? { [fixed[1]]: fixed[2] } : it.q ? sitelinks.get(it.q) ?? {} : {};
    it.wp = sl.es ? `es:${sl.es}` : sl.en ? `en:${sl.en}` : null;
    if (sl.es) {
      it.summary = (await summary('es', sl.es)).slice(0, 1400);
      it.sights = sights(await fullText('es', sl.es), SIGHTS);
    }
    if ((!it.summary || it.summary.length < 250 || (it.sights ?? '').length < 300) && sl.en) {
      it.summaryEn = (await summary('en', sl.en)).slice(0, 1000);
      it.sightsEn = sights(await fullText('en', sl.en), SIGHTS_EN, 900);
    }
    process.stdout.write(`\rWikipedia ${++n}/${items.length}`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
console.log('');

// ── Tandas por grupo ─────────────────────────────────────────────────────────
const groups = ['cities', 'flags', 'features', 'monuments', 'colombia'];
let files = 0;
for (const g of groups) {
  const list = items.filter((i) => i.group === g).sort((a, b) => a.id.localeCompare(b.id));
  chunks(list, BATCH).forEach((batch, k) => {
    writeFileSync(join(OUT, 'sources', `${g}-${String(k + 1).padStart(2, '0')}.json`), JSON.stringify(batch.map(({ q, group, ...rest }) => rest), null, 1));
    files++;
  });
}
const thin = items.filter((i) => !i.summary && !i.summaryEn);
console.log(`tandas: ${files} · sin artículo: ${thin.length} (${thin.slice(0, 12).map((i) => i.id).join(', ')}) · con frases de qué ver: ${items.filter((i) => (i.sights ?? i.sightsEn ?? '').length > 200).length}`);

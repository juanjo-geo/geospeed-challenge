/**
 * Galería de la reseña del lugar (bloque R2, docs/GeoSpeed_Resena_Lugar_Diseno.md): de 2 a 4 fotos más por lugar
 * para el carrusel de "Conoce X". No se descargan: el teléfono pide la miniatura a Wikimedia al abrir la reseña
 * (decisión RS-D1). Aquí solo se elige qué archivos de Wikimedia Commons mostrar y se guarda su autor y licencia.
 *
 * De dónde salen, para cada elemento con id de Wikidata (src/data/placeFacts.json, Fase 8):
 *  1) Las imágenes que Wikidata marca como vistas del lugar: P18 (imagen), P8592 (vista aérea), P3451 (de noche),
 *     P4291 (panorámica), P5252 (en invierno), P5775 (interior), P2716 (collage).
 *  2) Las imágenes del artículo de Wikipedia en español (o en inglés si el español no tiene o tiene pocas), en orden.
 *     En los países no se usa el artículo del país (trae historia, política, embajadas…) sino los de turismo y
 *     geografía: "Turismo en X", "Tourism in X" y "Geography of X".
 * Y se quedan solo las que:
 *  - son fotos (JPEG o PNG, sin mapas, banderas, escudos, logos, gráficos… por nombre y por categorías de Commons);
 *  - no muestran personas, guerras, política, pinturas o monedas (categorías de Commons y nombre del archivo);
 *  - tienen licencia libre (CC BY, CC BY-SA, CC0, dominio público), con su autor;
 *  - son horizontales y de al menos 1.000 × 600 px (Wikimedia solo sirve miniaturas de tamaños estándar: 500 y 960);
 *  - no son una foto que el juego ya muestra (las de public/cities, public/landmarks y public/countries).
 *
 * Escribe src/data/gallery/<grupo>.json — { id: [[archivo, hash2, autor, licencia], …] } por grupo (cities, flags,
 * features, monuments, colombia, pro), que src/lib/placeGallery.ts carga por separado al abrir una reseña — y
 * docs/R2_Galeria_fotos.md (resumen y lista para revisar).
 *
 * Uso: node scripts/build-place-gallery.mjs --out <carpeta de trabajo>
 * (las respuestas de Wikidata, Wikipedia y Commons se guardan en <trabajo>/cache y no se vuelven a pedir)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg('--out');
if (!OUT) { console.error('Uso: node scripts/build-place-gallery.mjs --out <carpeta de trabajo>'); process.exit(1); }
mkdirSync(join(OUT, 'cache'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 120;
const MAX_PER_PLACE = 4;
const MIN_W = 1000, MIN_H = 600;

/** Ni mapas, ni banderas, ni escudos, ni gráficos (el nombre del archivo) */
const NOT_A_PHOTO = /flag|bandera|coat[\s_-]*of[\s_-]*arms|escudo|wappen|blason|blazon|locator|location|karte|carte|diagram|chart|graph|gr[aá]fic|plano|plan\b|layout|census|population|poblaci[oó]n|pyramid|election|elecci[oó]n|(^|\P{L})(map|mapa|seal|logo|sello|icon|emblem)(\P{L}|$)|\.(svg|gif|tiff?|webp)$/iu;
/** Ni personas, ni guerra, ni política, ni arte o dinero, ni fotos satelitales (el nombre del archivo) */
const NOT_THE_PLACE = /portrait|retrato|president|presidente|king\b|queen\b|emperor|emperador|minister|ministro|signing|firma\b|battle|batalla|\bwar\b|guerra|soldier|soldado|army|ej[eé]rcito|massacre|masacre|protest|protesta|riot|disturbio|bomb|funeral|coin|moneda|banknote|billete|stamp\b|painting|pintura|engraving|grabado|lithograph|litograf|drawing|dibujo|caricature|\bpope\b|\bpapa\b|bishop|obispo|selfie|embass|embajada|consulat|consulado|ambassad|police|polic[ií]a|\bnavy\b|naval|frigate|fragata|warship|meeting|reuni[oó]n|\bvisit|visita|ceremon|conference|conferencia|summit|cumbre|delegat|delegaci|parade|desfile|satellite|sat[eé]lite|landsat|sentinel|from space|desde el espacio|\bISS\d|\bSTS-?\d|astronaut/iu;
/** Categorías de Commons que delatan algo que no es una foto del lugar */
const BAD_CATEGORY = /portrait|people of|\bpeople\b|men of|women of|crowds?\b|politicians|presidents|monarchs|royalty|military|soldiers|battles?\b|\bwars?\b|maps|flags|coats of arms|logos|diagrams|charts|graphs|paintings|drawings|engravings|illustrations|lithographs|caricatures|signatures|coins|banknotes|postage stamps|protests|demonstrations|riots|crime|disasters|damage|funerals|corpses|weapons|sculptures of people|statues of people|black and white photographs|historical images|history of|historical photographs|old photographs|1[5-9]th[- ]century|\bin art\b|artworks|embass|consulat|diplomatic|police|navy|naval|warships|frigates|satellite|from space|ISS Expedition|astronaut|landsat|sentinel-2|meetings|visits|ceremon|conferences|summits|officials|delegations|parades|photographs by .* \(\d{4}s?\)/i;
/** Fotos antiguas (años 1800–1969 en el nombre o en las categorías), placas con texto y eventos con público */
const OLD_OR_TEXT = /\b1[89]\d\d\b|\b19[0-6]\d\b|inscription|inscripci[oó]n|plaque|placa\b|\btext\b|letrero|concert|concierto|festival|carnival|carnaval|marathon|marat[oó]n|podium|podio|ePrix|dynamics|expedi|retreat|mural|fresco/iu;
const OLD_OR_EVENT_CATEGORY = /\b1[89]\d\ds?\b|\b19[0-6]\ds?\b|inscriptions|plaques|texts\b|signs\b|concerts|events\b|festivals|carnivals|marathons|sports events|fireworks/i;
const PHOTO_MIME = new Set(['image/jpeg', 'image/png']);
/** Licencias aceptadas: CC BY, CC BY-SA (cualquier versión o puerto), CC0 y dominio público */
const isFree = (s) => /^(CC[- ]BY(?:[- ]SA)?\b|CC0\b|Public domain|PD\b)/i.test(s) && !/\b(NC|ND)\b/i.test(s.replace(/^CC[- ]BY(?:[- ]SA)?/i, ''));
const WD_IMAGE_PROPS = ['P18', 'P8592', 'P3451', 'P4291', 'P5252', 'P5775', 'P2716'];
/** Revisión a mano: archivos (nombre con guiones bajos) y lugares (id) que no deben tener galería */
const EXCLUDE_FILES = new Set([
  'Buenos_Aires_-_Obelisco_(fachada_norte)_-_20061212a.jpg', // inscripciones del Obelisco (texto, no el monumento)
  'Buenos_Aires_-_Obelisco_(fachada_oeste)_-_20061212a.jpg',
  'Buenos_Aires_-_Obelisco_(fachada_sur)_-_20061212a.jpg',
  'Fundación_de_Caracas.jpg', // un mural de la fundación
  'Tokyo_Tower_look_down_window.JPG', // pies sobre el piso de vidrio
]);
const EXCLUDE_PLACES = new Set([]);

// ── Red con caché ────────────────────────────────────────────────────────────
const cacheFile = (key) => join(OUT, 'cache', key.replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) + '_' + createHash('md5').update(key).digest('hex').slice(0, 12) + '.json');
async function getJson(url, key) {
  const f = cacheFile(key);
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }); } catch { await sleep(3000 * 2 ** attempt); continue; }
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(PAUSE_MS); return j; }
    if (res.status === 404) { writeFileSync(f, 'null'); return null; }
    if (res.status === 429 || res.status >= 500) { const s = Number(res.headers.get('retry-after')); await sleep(Number.isFinite(s) && s > 0 ? Math.min(s, 120) * 1000 : 3000 * 2 ** attempt); continue; }
    throw new Error(`${res.status} ${url.slice(0, 200)}`);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 200)}`);
}
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const norm = (name) => name.replace(/^(File|Archivo|Image|Imagen):/i, '').replace(/_/g, ' ').trim();
const under = (name) => norm(name).replace(/ /g, '_');
const hash2 = (name) => createHash('md5').update(under(name)).digest('hex').slice(0, 2);
/** Autor legible: sin "Taken by the uploader", "User:", "w:es:Usuario:", "Original uploader was … at en.wikipedia" ni enlaces */
function cleanAuthor(raw) {
  let a = raw;
  const orig = a.match(/(?:The\s+)?original uploader was\s+(.+?)\s+at\s+/i);
  if (orig) a = orig[1];
  a = a.replace(/^Taken by the uploader,?\s*/i, '').replace(/^Own work,?\s*(by\s+)?/i, '').replace(/^This Image was created by\s+/i, '')
    .replace(/\b(?:w:)?[a-z]{2,3}:(?:user|usuario|usuaria|benutzer|utilisateur):/gi, '').replace(/\bUser:|\bUsuario:/gi, '')
    .replace(/\s*Uploader:.*$/i, '').replace(/\s*If you are using.*$/i, '').replace(/^Photo:\s*/i, '').replace(/\s*Statue:.*$/i, '')
    .replace(/https?:\/\/(?:www\.)?flickr\.com\/(?:photos|people)\/([^/\s]+)\/?\S*/gi, '$1 (Flickr)').replace(/https?:\/\/\S+/g, '')
    .replace(/\s+\.\s*$/, '').replace(/\s+/g, ' ').trim();
  return a || raw;
}
const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// ── Catálogo (nombres para el documento y grupos) ────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-gallery-'));
const entry = join(tmp, 'entry.ts');
writeFileSync(entry, `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { FLAG_ITEMS } from '@/data/flagCatalog';
export { FEATURE_ITEMS } from '@/data/featureCatalog';
export { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
export { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
export { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from '@/data/proPackCatalog';
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: join(tmp, 'entry.js'), alias: { '@': resolve('src') }, logLevel: 'warning', loader: { '.json': 'json' } });
const C = await import(pathToFileURL(join(tmp, 'entry.js')).href);
const nameOf = new Map();
for (const list of [C.worldCities, C.europeCities, C.asiaCities, C.americasCities, C.africaCities, C.FLAG_ITEMS, C.FEATURE_ITEMS, C.LANDMARK_ITEMS, C.COLOMBIA_CITIES, C.COLOMBIA_DIVISIONS, C.PRO_PACK_CITIES, C.PRO_PACK_DIVISIONS]) {
  for (const it of list) if (it.id && !nameOf.has(it.id)) nameOf.set(it.id, it.name);
}
function groupOf(id) {
  if (id.startsWith('flag:')) return 'flags';
  if (id.startsWith('feat:')) return 'features';
  if (id.startsWith('mon:')) return 'monuments';
  if (id.startsWith('co:') || id.startsWith('div:co-')) return 'colombia';
  if (id.startsWith('ci:') || id.startsWith('div:')) return 'pro';
  return 'cities';
}
const facts = JSON.parse(read('src/data/placeFacts.json'));
const items = Object.entries(facts).filter(([id, f]) => f.q && !EXCLUDE_PLACES.has(id)).map(([id, f]) => ({ id, q: f.q, name: nameOf.get(id) ?? id, group: groupOf(id) }));
console.log(`elementos con id de Wikidata: ${items.length}`);

// Fotos que el juego ya muestra (no se repiten en el carrusel)
const used = new Set();
for (const c of JSON.parse(read('public/cities/credits.json'))) if (c.source) used.add(under(c.source));
for (const c of JSON.parse(read('public/landmarks/credits.json'))) if (c.source) used.add(under(c.source));
for (const c of JSON.parse(read('public/countries/credits.json'))) if (c.url) used.add(under(decodeURIComponent(c.url.split('/File:').pop() ?? '')));
console.log(`fotos propias del juego (excluidas): ${used.size}`);

// ── 1) Wikidata: artículos de Wikipedia e imágenes del lugar ─────────────────
const wd = new Map();
const qids = [...new Set(items.map((i) => i.q))];
let n = 0;
for (const batch of chunks(qids, 50)) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=claims|sitelinks&sitefilter=eswiki|enwiki&format=json`;
  const j = await getJson(url, `wd_${batch[0]}_${batch.length}_${createHash('md5').update(batch.join()).digest('hex').slice(0, 8)}`);
  for (const [q, e] of Object.entries(j?.entities ?? {})) {
    const imgs = [];
    for (const p of WD_IMAGE_PROPS) {
      const claims = (e.claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated').sort((a, b) => (b.rank === 'preferred') - (a.rank === 'preferred'));
      for (const c of claims) { const v = c.mainsnak?.datavalue?.value; if (typeof v === 'string') imgs.push(v); }
    }
    wd.set(q, { es: e.sitelinks?.eswiki?.title ?? null, en: e.sitelinks?.enwiki?.title ?? null, imgs });
  }
  process.stdout.write(`\rWikidata ${(n += batch.length)}/${qids.length}`);
}
console.log('');

// ── 2) Imágenes de los artículos de Wikipedia ────────────────────────────────
const mediaList = async (lang, title) => {
  const j = await getJson(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, '_'))}?redirect=true`, `ml_${lang}_${title}`);
  return (j?.items ?? []).filter((x) => x.type === 'image' && x.showInGallery !== false && x.title).map((x) => norm(x.title)).slice(0, 20);
};
const candidates = new Map(); // id → [archivo…] en orden de preferencia
n = 0;
const queue = [...items];
async function worker() {
  for (let it = queue.shift(); it; it = queue.shift()) {
    const w = wd.get(it.q) ?? { es: null, en: null, imgs: [] };
    let list = w.imgs.map(norm);
    const preFiltered = () => list.filter((f) => !NOT_A_PHOTO.test(f) && !NOT_THE_PLACE.test(f) && !used.has(under(f)));
    if (it.group === 'flags') {
      // Países: artículos de turismo y geografía (el del país trae historia, política, embajadas…)
      if (w.es) list = list.concat(await mediaList('es', `Turismo en ${w.es}`));
      if (w.en) list = list.concat(await mediaList('en', `Tourism in ${w.en}`));
      if (preFiltered().length < 6 && w.en) list = list.concat(await mediaList('en', `Geography of ${w.en}`));
    } else {
      if (w.es) list = list.concat(await mediaList('es', w.es));
      if (preFiltered().length < 6 && w.en) list = list.concat(await mediaList('en', w.en));
    }
    candidates.set(it.id, [...new Set(preFiltered())]);
    process.stdout.write(`\rWikipedia ${++n}/${items.length}`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
console.log('');

// ── 3) Commons: tamaño, tipo, licencia, autor y categorías ───────────────────
const allFiles = [...new Set([...candidates.values()].flat())];
const info = new Map();
n = 0;
for (const batch of chunks(allFiles, 50)) {
  const titles = batch.map((f) => `File:${f}`).join('|');
  const url = `https://commons.wikimedia.org/w/api.php?action=query&redirects=1&prop=imageinfo&iiprop=size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|Artist|Categories&titles=${encodeURIComponent(titles)}&format=json&formatversion=2`;
  const j = await getJson(url, `ii_${createHash('md5').update(titles).digest('hex')}`);
  // Commons normaliza los nombres (mayúscula inicial…) y sigue redirecciones: se guarda también con el nombre pedido
  const normalized = new Map([...(j?.query?.normalized ?? []), ...(j?.query?.redirects ?? [])].map((x) => [norm(x.to), norm(x.from)]));
  for (const p of j?.query?.pages ?? []) {
    const ii = p.imageinfo?.[0];
    if (!ii || p.missing) continue;
    const m = ii.extmetadata ?? {};
    const name = norm(p.title);
    info.set(normalized.get(name) ?? name, { name, w: ii.width, h: ii.height, mime: ii.mime, license: stripHtml(m.LicenseShortName?.value), author: cleanAuthor(stripHtml(m.Artist?.value)), cats: m.Categories?.value ?? '' });
    info.set(name, info.get(normalized.get(name) ?? name));
  }
  process.stdout.write(`\rCommons ${(n += batch.length)}/${allFiles.length}`);
}
console.log('');

// ── 4) Elegir hasta 4 por lugar ──────────────────────────────────────────────
const why = {};
const reject = (k) => { why[k] = (why[k] ?? 0) + 1; return false; };
const ok = (f) => {
  const i = info.get(f);
  if (!i) return reject('no está en Commons');
  if (!PHOTO_MIME.has(i.mime)) return reject('no es JPEG ni PNG');
  if (!isFree(i.license)) return reject('licencia no libre');
  if (!i.author) return reject('sin autor');
  if (i.w < MIN_W || i.h < MIN_H) return reject('pequeña');
  const r = i.w / i.h;
  if (r < 1.05 || r > 2.6) return reject('no es horizontal');
  if (BAD_CATEGORY.test(i.cats)) return reject('categoría (personas, mapas, arte, guerra…)');
  if (OLD_OR_TEXT.test(i.name) || OLD_OR_EVENT_CATEGORY.test(i.cats)) return reject('antigua, con texto o un evento');
  if (used.has(under(i.name))) return reject('ya es foto del juego');
  if (EXCLUDE_FILES.has(under(i.name))) return reject('excluida a mano');
  return true;
};
const out = {};
const chosen = new Map();
for (const it of items) {
  const picks = [];
  for (const f of candidates.get(it.id) ?? []) {
    if (picks.length >= MAX_PER_PLACE) break;
    const i = info.get(f);
    if (i && picks.some((p) => under(p.name) === under(i.name))) continue;
    if (ok(f)) picks.push(i);
  }
  if (!picks.length) continue;
  chosen.set(it.id, picks);
  (out[it.group] ??= {})[it.id] = picks.map((p) => [under(p.name), hash2(p.name), p.author.slice(0, 60), p.license]);
}

mkdirSync('src/data/gallery', { recursive: true });
// Los 6 archivos siempre (el juego los importa por nombre), aunque un grupo quede vacío
for (const g of ['cities', 'flags', 'features', 'monuments', 'colombia', 'pro']) {
  const sorted = Object.fromEntries(Object.entries(out[g] ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(`src/data/gallery/${g}.json`, JSON.stringify(sorted));
}

// ── 5) Documento de revisión ─────────────────────────────────────────────────
const groups = ['cities', 'flags', 'features', 'monuments', 'colombia', 'pro'];
const GROUP_ES = { cities: 'Ciudades del mundo', flags: 'Países', features: 'Lugares geográficos', monuments: 'Monumentos', colombia: 'Pack Colombia', pro: 'Packs Pro' };
const stats = groups.map((g) => {
  const all = items.filter((i) => i.group === g);
  const withG = all.filter((i) => chosen.has(i.id));
  const photos = withG.reduce((s, i) => s + chosen.get(i.id).length, 0);
  return { g, total: all.length, with: withG.length, photos };
});
const lic = {};
for (const ps of chosen.values()) for (const p of ps) { const k = /^CC0|^Public domain|^PD/i.test(p.license) ? 'CC0 / dominio público' : p.license.replace(/\s+\d.*$/, ''); lic[k] = (lic[k] ?? 0) + 1; }
const commons = (f) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(under(f))}`;
let doc = `# Reseña del lugar · R2 · fotos de la galería (para revisar)

Generado por \`node scripts/build-place-gallery.mjs\` el ${new Date().toISOString().slice(0, 10)}. Las fotos no están en el juego: el teléfono
pide la miniatura a Wikimedia (500 o 960 px) al abrir "Conoce X", y debajo de cada una se ve su autor y su licencia.
Para quitar una foto, anótala en \`EXCLUDE_FILES\` del script (o el lugar en \`EXCLUDE_PLACES\`) y vuelve a correrlo.

| Grupo | Lugares | Con galería | Fotos |
|---|---|---|---|
${stats.map((s) => `| ${GROUP_ES[s.g]} | ${s.total} | ${s.with} | ${s.photos} |`).join('\n')}

Licencias: ${Object.entries(lic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}.

Descartadas (por motivo, contando cada archivo cada vez que se evaluó): ${Object.entries(why).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}.
`;
for (const g of groups) {
  doc += `\n## ${GROUP_ES[g]}\n\n`;
  for (const it of items.filter((i) => i.group === g).sort((a, b) => a.name.localeCompare(b.name, 'es'))) {
    const ps = chosen.get(it.id);
    doc += ps ? `- **${it.name}**: ${ps.map((p, k) => `[${k + 1}](${commons(p.name)})`).join(' · ')}\n` : `- ${it.name}: _sin fotos aceptables_\n`;
  }
}
writeFileSync('docs/R2_Galeria_fotos.md', doc);
console.table(stats);
console.log('licencias', lic);
console.log('descartes', why);

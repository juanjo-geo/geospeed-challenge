/**
 * Fotos de las ciudades: una foto por ciudad del juego (ciudades del mundo, municipios del pack Colombia `co:` y
 * ciudades de los packs Pro `ci:`), para mostrarla en lugar de la foto del país. Sale de la imagen principal (P18)
 * de cada ciudad en Wikidata, con el id que ya trae src/data/placeFacts.json (Fase 8), y de Wikimedia Commons:
 * autor y licencia (solo libres: CC BY, CC BY-SA, CC0, dominio público).
 *
 * Escribe en la carpeta de trabajo (nunca en el repo):
 *  1) <trabajo>/img/<slug>.jpg — miniatura de 900 px de Commons (slug = id con ':' cambiado por '-': `medellin`,
 *     `co-guatape`, `ci-pe-cusco`) y <trabajo>/img/<slug>.src.txt con el archivo de Commons del que salió. La
 *     descarga se reutiliza solo si el archivo de origen es el mismo: si la imagen elegida cambia entre corridas
 *     (otra P18, una exclusión, otra licencia) se vuelve a bajar.
 *  2) <trabajo>/meta.json — [{ id, slug, name, country, q, file, source, author, license, licenseUrl, url }], que
 *     scripts/convert-city-photos.py convierte a public/cities/<slug>.webp + credits.json + src/data/cityPhotoIds.ts.
 *  3) <trabajo>/report.json — las ciudades sin foto y el motivo (sin id de Wikidata, sin P18, solo mapas o escudos,
 *     sin licencia libre, excluida a mano, descarga fallida).
 *
 * Imágenes que se descartan por el nombre del archivo: banderas, escudos, sellos, logos, mapas y localizadores, y
 * los formatos .svg/.gif/.tif. Las que pasan el filtro pero no muestran la ciudad (un retrato, un documento…) se
 * descubren mirando la hoja de contacto y se anotan en EXCLUDE: esa ciudad sigue con la foto del país.
 *
 * Uso: node scripts/build-city-photos.mjs --out <carpeta de trabajo>
 * (las respuestas de Wikidata y Commons se guardan en <trabajo>/cache y no se vuelven a pedir)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg('--out') ?? process.env.CITY_PHOTOS_DIR;
if (!OUT) { console.error('Uso: node scripts/build-city-photos.mjs --out <carpeta de trabajo>'); process.exit(1); }
mkdirSync(join(OUT, 'cache'), { recursive: true });
mkdirSync(join(OUT, 'img'), { recursive: true });
const read = (f) => readFileSync(f, 'utf8');
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAUSE_MS = 250;
const THUMB_WIDTH = 900;

/**
 * Ciudades cuya imagen P18 no muestra el lugar (revisión de la hoja de contacto): se quedan sin foto propia y el
 * juego sigue mostrando la del país. Id del juego (no el slug).
 */
const EXCLUDE = new Set([
  'ci:do-barahona', // imagen de satélite de la costa (un mapa, no una foto de la ciudad)
  'ci:do-mao', // primer plano de una estatua de Jesús; no se ve nada del pueblo
  'ci:jm-port-morant', // una pintura (postal en acuarela), no una foto
  'ci:jm-saint-ann-s-bay', // estatua de Marcus Garvey (retrato), no el pueblo
  'ci:sv-la-union', // mural con el mapa del departamento y la fecha impresa en la foto
  'ci:ve-acarigua', // página escaneada de una publicación de 1896, con el pie de imprenta
]);

/**
 * Nombres de archivo que no son una foto de la ciudad (bandera, escudo, sello, logo, mapa, localizador, formatos no
 * fotográficos). map/mapa/seal/logo solo como palabra suelta: "Río Mapocho", "Logroño" o "Diálogo" son fotos.
 */
const NOT_A_PHOTO = /flag|bandera|coat[\s_-]*of[\s_-]*arms|escudo|wappen|blason|blazon|locator|location|karte|(^|\P{L})(map|mapa|seal|logo)(\P{L}|$)|\.(svg|gif|tiff?)$/iu;
const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
/** Licencias aceptadas: CC BY, CC BY-SA (cualquier versión o puerto), CC0 y dominio público. Fuera: GFDL sola, FAL, KOGL, "CC SA 1.0", NC/ND y desconocidas */
const isFree = (s) => /^(CC[- ]BY(?:[- ]SA)?\b|CC0\b|Public domain|PD\b)/i.test(s) && !/\b(NC|ND)\b/i.test(s.replace(/^CC[- ]BY(?:[- ]SA)?/i, ''));

// ── Red con caché ────────────────────────────────────────────────────────────
const cacheFile = (key) => join(OUT, 'cache', key.replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) + '_' + createHash('md5').update(key).digest('hex').slice(0, 12) + '.json');
const retryAfter = (res, attempt) => {
  const s = Number(res.headers.get('retry-after'));
  return Number.isFinite(s) && s > 0 ? Math.min(s, 120) * 1000 : 3000 * 2 ** attempt;
};
async function getJson(url, key, init) {
  const f = cacheFile(key);
  if (existsSync(f)) return JSON.parse(read(f));
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init?.headers ?? {}) } });
    } catch (e) { await sleep(3000 * 2 ** attempt); continue; }
    if (res.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(PAUSE_MS); return j; }
    if (res.status === 429 || res.status >= 500) { await sleep(retryAfter(res, attempt)); continue; }
    throw new Error(`${res.status} ${url.slice(0, 200)}`);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 200)}`);
}
/** Baja una imagen; devuelve false si no hay manera (404, no es una imagen, reintentos agotados) */
async function download(url, file) {
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA } }); } catch { await sleep(3000 * 2 ** attempt); continue; }
    if (res.ok) {
      const type = res.headers.get('content-type') ?? '';
      const buf = Buffer.from(await res.arrayBuffer());
      await sleep(PAUSE_MS);
      if (!type.startsWith('image/') || buf.length < 2000) { console.warn(`  no es una imagen (${type}, ${buf.length} B): ${url}`); return false; }
      writeFileSync(file, buf);
      return true;
    }
    if (res.status === 429 || res.status >= 500) { await sleep(retryAfter(res, attempt)); continue; }
    console.warn(`  foto no descargada (${res.status}): ${url}`);
    return false;
  }
  console.warn(`  foto no descargada (reintentos agotados): ${url}`);
  return false;
}

// ── Catálogo (TS → JS con esbuild) ───────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'geospeed-cityphotos-'));
const entry = join(tmp, 'entry.ts');
writeFileSync(entry, `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
export { PRO_PACK_CITIES } from '@/data/proPackCatalog';
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: join(tmp, 'entry.js'), alias: { '@': resolve('src') }, logLevel: 'warning' });
const C = await import(pathToFileURL(join(tmp, 'entry.js')).href);
const facts = JSON.parse(read('src/data/placeFacts.json'));

const seen = new Set();
const CITIES = [
  ...[...C.worldCities, ...C.europeCities, ...C.asiaCities, ...C.americasCities, ...C.africaCities].map((c) => ({ c, group: 'world' })),
  ...C.COLOMBIA_CITIES.map((c) => ({ c, group: 'co' })),
  ...C.PRO_PACK_CITIES.map((c) => ({ c, group: 'ci' })),
].filter(({ c }) => c.id && (seen.has(c.id) ? false : (seen.add(c.id), true)))
  .map(({ c, group }) => ({ id: c.id, slug: c.id.replace(/:/g, '-'), name: c.name, country: c.country, group, q: facts[c.id]?.q ?? null }));
console.log(`ciudades: ${CITIES.length} (mundo ${CITIES.filter((c) => c.group === 'world').length} · co ${CITIES.filter((c) => c.group === 'co').length} · ci ${CITIES.filter((c) => c.group === 'ci').length})`);

// ── Wikidata: imagen principal (P18, mejor rango) ────────────────────────────
const SPARQL = 'https://query.wikidata.org/sparql';
const sparql = (query) => getJson(SPARQL, `sparql_${createHash('md5').update(query).digest('hex')}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
  body: new URLSearchParams({ query, format: 'json' }).toString(),
}).then((j) => j.results.bindings);
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
/** "http://commons.wikimedia.org/wiki/Special:FilePath/Foo%20bar.jpg" → "Foo bar.jpg" */
const fileFromUri = (uri) => decodeURIComponent(uri.split('/Special:FilePath/').pop()).replace(/_/g, ' ');

const qids = [...new Set(CITIES.map((c) => c.q).filter(Boolean))];
// Q → { p18: [archivo, …], collage: [archivo, …] } en el orden de la respuesta. La imagen principal (P18) va primero;
// el collage (P2716, montaje de fotos de la ciudad) solo se usa si la ciudad no tiene una P18 aceptable (Bagdad, San Salvador…)
const imagesOf = new Map();
const addImage = (q, kind, file) => {
  const e = imagesOf.get(q) ?? { p18: [], collage: [] };
  if (!e[kind].includes(file)) e[kind].push(file);
  imagesOf.set(q, e);
};
for (const part of chunks(qids, 150)) {
  const rows = await sparql(`SELECT ?item ?img ?collage WHERE { VALUES ?item { ${part.map((q) => `wd:${q}`).join(' ')} } OPTIONAL { ?item wdt:P18 ?img . } OPTIONAL { ?item wdt:P2716 ?collage . } }`);
  for (const r of rows) {
    const q = r.item.value.split('/').pop();
    if (r.img) addImage(q, 'p18', fileFromUri(r.img.value));
    if (r.collage) addImage(q, 'collage', fileFromUri(r.collage.value));
  }
}
// La Query Service va con retraso respecto a Wikidata: lo que llega sin imagen se confirma con la API (mejor rango)
const WD = 'https://www.wikidata.org/w/api.php';
const bestValues = (ent, p) => {
  const st = (ent?.claims?.[p] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue?.value);
  const pref = st.filter((c) => c.rank === 'preferred');
  return (pref.length ? pref : st).map((c) => String(c.mainsnak.datavalue.value).replace(/_/g, ' '));
};
const noImage = qids.filter((q) => !imagesOf.get(q)?.p18.length);
for (const part of chunks(noImage, 50)) {
  const j = await getJson(`${WD}?action=wbgetentities&ids=${part.join('|')}&props=claims&format=json`, `ent_${part.join('_')}`);
  for (const q of part) {
    for (const f of bestValues(j.entities?.[q], 'P18')) addImage(q, 'p18', f);
    for (const f of bestValues(j.entities?.[q], 'P2716')) addImage(q, 'collage', f);
  }
}
const imageList = (q) => { const e = imagesOf.get(q); return e ? [...e.p18, ...e.collage] : []; };
console.log(`con P18: ${qids.filter((q) => imagesOf.get(q)?.p18.length).length} · solo collage (P2716): ${qids.filter((q) => !imagesOf.get(q)?.p18.length && imagesOf.get(q)?.collage.length).length} · de ${qids.length} ids de Wikidata`);

// ── Commons: licencia, autor y tipo de cada imagen candidata ─────────────────
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const stripHtml = (s) => String(s ?? '')
  .replace(/<span[^>]*display:\s*none[^>]*>.*?<\/span>/gi, '') // texto oculto ("Unknown author<span hidden>Unknown author</span>")
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
/** Autor legible: sin la coletilla de Commons para los archivos sin autor declarado ni el sufijo de cuentas fusionadas */
const cleanAuthor = (s) => {
  const a = s.replace(/^No machine-readable author provided\.\s*(.+?)\s+assumed \(based on copyright claims\)\.?$/i, '$1').replace(/~commonswiki/gi, '').trim();
  return /^(own work|trabajo propio|travail personnel|eigenes werk)$/i.test(a) ? '' : a;
};
/** Quien subió la primera versión del archivo: el autor cuando la página no declara uno (mismo criterio que Commons) */
async function firstUploader(file) {
  const j = await getJson(`${COMMONS}?action=query&prop=imageinfo&iiprop=user&iilimit=50&titles=${encodeURIComponent('File:' + file)}&format=json&formatversion=2`, `uploader_${file}`);
  const revs = j.query?.pages?.[0]?.imageinfo ?? [];
  return revs.length ? String(revs[revs.length - 1].user ?? '').replace(/~commonswiki/gi, '') : '';
}
const candidates = [...new Set(qids.flatMap(imageList).filter((f) => !NOT_A_PHOTO.test(f)))].sort();
const infoOf = new Map(); // archivo → { author, license, licenseUrl, url, mime } | null
for (const part of chunks(candidates, 50)) {
  const titles = part.map((f) => 'File:' + f).join('|');
  const j = await getJson(`${COMMONS}?action=query&prop=imageinfo&iiprop=extmetadata|url|mime&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|Credit&titles=${encodeURIComponent(titles)}&format=json&formatversion=2`, `commons_${titles}`);
  // Commons normaliza los títulos (guiones bajos, mayúscula inicial): se deshace con `normalized`
  const back = new Map((j.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of j.query?.pages ?? []) {
    const asked = (back.get(page.title) ?? page.title).replace(/^File:/, '');
    const info = page.imageinfo?.[0];
    if (!info) { infoOf.set(asked, null); continue; }
    const m = info.extmetadata ?? {};
    infoOf.set(asked, {
      author: cleanAuthor(stripHtml(m.Artist?.value)), // vacío = se completa con quien lo subió (firstUploader)
      license: stripHtml(m.LicenseShortName?.value),
      licenseUrl: stripHtml(m.LicenseUrl?.value),
      url: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent('File:' + asked)}`,
      mime: info.mime,
    });
  }
}

// ── Elección y descarga ──────────────────────────────────────────────────────
const meta = [];
const missing = [];
const bySource = new Map(); // archivo de Commons → imagen ya descargada en esta corrida (municipios que también son ciudades del mundo)
let downloaded = 0, reused = 0;
for (const city of CITIES) {
  const skip = (reason, detail) => { missing.push({ id: city.id, name: city.name, country: city.country, q: city.q, reason, ...(detail ? { detail } : {}) }); };
  if (!city.q) { skip('sin id de Wikidata'); continue; }
  if (EXCLUDE.has(city.id)) { skip('excluida a mano (revisión de la hoja de contacto)'); continue; }
  const images = imageList(city.q);
  if (!images.length) { skip('sin P18 ni collage'); continue; }
  const rejected = [];
  let pick = null;
  for (const file of images) {
    if (NOT_A_PHOTO.test(file)) { rejected.push(`${file}: no es una foto`); continue; }
    const info = infoOf.get(file);
    if (!info) { rejected.push(`${file}: sin datos en Commons`); continue; }
    if (!PHOTO_MIME.has(info.mime)) { rejected.push(`${file}: ${info.mime}`); continue; }
    if (!isFree(info.license)) { rejected.push(`${file}: licencia ${info.license || 'desconocida'}`); continue; }
    pick = { file, ...info };
    if (!pick.author) pick.author = (await firstUploader(file)) || 'Wikimedia Commons';
    break;
  }
  if (!pick) {
    const onlyNames = rejected.every((r) => r.endsWith('no es una foto'));
    skip(onlyNames ? 'solo mapas, escudos o banderas' : 'sin licencia libre', rejected.join(' / '));
    continue;
  }
  const img = join(OUT, 'img', `${city.slug}.jpg`);
  const srcTxt = join(OUT, 'img', `${city.slug}.src.txt`);
  const have = existsSync(img) && existsSync(srcTxt) && read(srcTxt).trim() === pick.file;
  let ok = have;
  if (!have) {
    const prev = bySource.get(pick.file);
    if (prev) { copyFileSync(prev, img); ok = true; reused++; }
    else {
      ok = await download(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(pick.file)}?width=${THUMB_WIDTH}`, img);
      if (ok) downloaded++;
    }
    if (ok) writeFileSync(srcTxt, pick.file);
  }
  if (!ok) { skip('descarga fallida', pick.file); continue; }
  bySource.set(pick.file, img);
  meta.push({
    id: city.id, slug: city.slug, name: city.name, country: city.country, q: city.q,
    file: `${city.slug}.jpg`, source: pick.file, author: pick.author, license: pick.license, licenseUrl: pick.licenseUrl, url: pick.url,
    bytes: statSync(img).size,
  });
  if (!have) process.stdout.write('.');
}
console.log();

writeFileSync(join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
writeFileSync(join(OUT, 'report.json'), JSON.stringify(missing, null, 1));

// ── Resumen ──────────────────────────────────────────────────────────────────
const by = (list, fn) => list.reduce((m, x) => { const k = fn(x); m[k] = (m[k] ?? 0) + 1; return m; }, {});
const groupOf = new Map(CITIES.map((c) => [c.id, c.group]));
console.log(`con foto: ${meta.length} de ${CITIES.length}`, by(meta, (m) => groupOf.get(m.id)));
console.log(`descargadas ahora: ${downloaded} · copiadas de otra ciudad con la misma imagen: ${reused}`);
console.log('sin foto:', by(missing, (m) => m.reason));
console.log('licencias:', by(meta, (m) => m.license));

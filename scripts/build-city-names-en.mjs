/**
 * Nombres en inglés de las ciudades (AUD05: con el juego en inglés salían "El Cairo", "Johannesburgo"…). Toma el QID de
 * cada ciudad de src/data/placeFacts.json y su etiqueta en inglés de Wikidata, y escribe src/data/cityNamesEn.ts solo con
 * las que cambian respecto al nombre en español (las de Colombia y los packs casi siempre son iguales).
 *
 * Uso: node scripts/build-city-names-en.mjs [--cache <carpeta>]   (las respuestas de Wikidata se guardan en la caché)
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const CACHE = arg('--cache') ?? join(tmpdir(), 'geospeed-city-names-cache');
mkdirSync(CACHE, { recursive: true });
const UA = 'GeoSpeedChallenge-build/1.0 (https://geospeed-challenge.vercel.app)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const f = join(CACHE, createHash('md5').update(url).digest('hex') + '.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }).catch(() => null);
    if (res?.ok) { const j = await res.json(); writeFileSync(f, JSON.stringify(j)); await sleep(300); return j; }
    await sleep(3000 * 2 ** attempt);
  }
  throw new Error(`sin respuesta: ${url.slice(0, 160)}`);
}

const tmp = mkdtempSync(join(tmpdir(), 'geospeed-names-'));
writeFileSync(join(tmp, 'e.ts'), `
export { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
export { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
export { PRO_PACK_CITIES } from '@/data/proPackCatalog';
`);
await build({ entryPoints: [join(tmp, 'e.ts')], bundle: true, format: 'esm', outfile: join(tmp, 'e.js'), alias: { '@': resolve('src') }, logLevel: 'error', loader: { '.json': 'json' } });
const C = await import(pathToFileURL(join(tmp, 'e.js')).href);
const cities = new Map();
for (const l of [C.worldCities, C.europeCities, C.asiaCities, C.americasCities, C.africaCities, C.COLOMBIA_CITIES, C.PRO_PACK_CITIES]) for (const c of l) if (c.id && !cities.has(c.id)) cities.set(c.id, c);
const facts = JSON.parse(readFileSync('src/data/placeFacts.json', 'utf8'));

const withQ = [...cities.values()].filter((c) => facts[c.id]?.q);
const qs = [...new Set(withQ.map((c) => facts[c.id].q))];
const labels = {};
for (let i = 0; i < qs.length; i += 50) {
  const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qs.slice(i, i + 50).join('|')}&props=labels&languages=en&format=json`);
  for (const [q, e] of Object.entries(j.entities ?? {})) labels[q] = e.labels?.en?.value ?? null;
}

// Solo las ciudades del mundo: las de Colombia y los packs (ids co: / ci:) tienen su nombre local, que también se usa en
// inglés (Wikidata daría nombres oficiales largos como "San Miguel de Tucumán"). Un cambio que solo quita o pone tildes
// SÍ cuenta: en inglés se escribe "Paris" y "Berlin", no "París" y "Berlín" (antes se descartaba y el juego en inglés
// preguntaba por "París"). Si la etiqueta inglesa es idéntica (Cancún, Bogotá) no se repite.
/** Revisión a mano: nombres oficiales largos o recortados por la coma */
const FIX = { puebla: null, 'santa-cruz': null, 'washington-d-c': 'Washington, D.C.' };
const out = {};
for (const c of withQ) {
  if (c.id.includes(':')) continue;
  let en = labels[facts[c.id].q];
  if (!en) continue;
  en = en.replace(/\s*\(.*\)\s*$/, '').split(',')[0].trim(); // "Victoria, Seychelles" → "Victoria"
  if (c.id in FIX) en = FIX[c.id] ?? c.name;
  if (!en || en === c.name) continue;
  out[c.id] = en;
}
const ids = Object.keys(out).sort();
writeFileSync('src/data/cityNamesEn.ts', `// Generado por scripts/build-city-names-en.mjs (etiquetas en inglés de Wikidata, CC0). No editar a mano.
/** Nombre en inglés de las ciudades cuyo nombre cambia respecto al español (id → nombre) */
export const CITY_NAMES_EN: Record<string, string> = {
${ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(out[id])},`).join('\n')}
};
`);
console.log(`ciudades: ${cities.size} · con QID: ${withQ.length} · nombre distinto en inglés: ${ids.length}`);
console.log(ids.slice(0, 40).map((id) => `${cities.get(id).name} → ${out[id]}`).join(' · '));

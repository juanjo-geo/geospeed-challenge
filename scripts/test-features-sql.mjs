/**
 * Paridad de la distancia a un lugar geográfico (Fase 6b) y a un departamento de un pack (Fase 7a) entre el teléfono
 * (src/lib/featureScoring.ts) y el servidor (shape_distance_km con is_line + la escala de cada modo) en un PostgreSQL
 * embebido (PGlite): miles de puntos alrededor de cada contorno (áreas, ríos, lugares puntuales y departamentos) deben
 * dar la misma distancia y la misma cercanía en los dos lados.
 *
 * Uso: npm run test:features-sql
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';

const SCORING = 'supabase/migrations/20261021120000_scoring_v2.sql';
const FLAGS = 'supabase/migrations/20261027120000_flags.sql';
const FEATURES = 'supabase/migrations/20261028120000_features.sql';
const COLOMBIA = 'supabase/migrations/20261030120000_colombia.sql';
const PRO = 'supabase/migrations/20261031120000_pro_packs.sql';

const dir = mkdtempSync(join(tmpdir(), 'geospeed-features-'));
await build({ entryPoints: ['src/lib/featureScoring.ts', 'src/lib/scoring.ts'], bundle: true, format: 'esm', outdir: dir, alias: { '@': resolve('src') }, external: ['react'], logLevel: 'warning' });
const fsc = await import(pathToFileURL(join(dir, 'featureScoring.js')).href);
const { closeness, scaleForMode } = await import(pathToFileURL(join(dir, 'scoring.js')).href);
const shapes = JSON.parse(readFileSync('src/data/featureShapes.json', 'utf8'));
const packShapes = JSON.parse(readFileSync('src/data/packShapes.json', 'utf8'));
const proShapes = JSON.parse(readFileSync('src/data/proPackShapes.json', 'utf8'));
fsc.__setFeatureShapes(shapes);
fsc.__setPackShapes(packShapes);
fsc.__setPackShapes(proShapes, 'pro');

const sv2 = readFileSync(SCORING, 'utf8');
const fl = readFileSync(FLAGS, 'utf8');
const ft = readFileSync(FEATURES, 'utf8');
const co = readFileSync(COLOMBIA, 'utf8');
const slice = (s, a, b) => s.slice(s.indexOf(a), b ? s.indexOf(b) : undefined);
const db = new PGlite();
await db.exec('create role anon; create role authenticated;');
await db.exec(sv2.slice(0, sv2.indexOf('-- ── 2) Columnas nuevas')));
await db.exec(slice(sv2, '-- ── 3) Funciones del puntaje', '-- ── 4) save_game_result'));
await db.exec(slice(fl, 'create table if not exists public.place_shapes', '-- ── C) _score_rounds_v2'));
await db.exec(slice(ft, '-- ── A)', '-- ── C)'));
await db.exec("alter table public.places drop constraint if exists places_kind_check; alter table public.places add constraint places_kind_check check (kind in ('city', 'flag', 'feature', 'monument', 'division'));");
await db.exec(slice(co, '-- ── B) Escala', '-- ── C)'));
await db.exec(slice(co, '-- ── F) Seed', '-- ── H) Seed'));
await db.exec(readFileSync(PRO, 'utf8'));

const cat = readFileSync('src/data/featureCatalog.ts', 'utf8');
const items = [...cat.matchAll(/id: '(feat:[a-z0-9-]+)', kind: 'feature', ftype: '\w+', geom: '(\w+)'.*?lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map((m) => ({ id: m[1], geom: m[2], lat: +m[3], lon: +m[4], mode: 'world' }));
if (items.length < 300) throw new Error(`catálogo de lugares no encontrado (${items.length})`);
const coCat = readFileSync('src/data/colombiaCatalog.ts', 'utf8');
const divisions = [...coCat.matchAll(/id: '(div:co-[a-z0-9-]+)', kind: 'division'.*?lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map((m) => ({ id: m[1], geom: 'area', lat: +m[2], lon: +m[3], mode: 'colombia' }));
if (divisions.length !== 33) throw new Error(`departamentos no encontrados (${divisions.length})`);
// Packs Pro: una de cada tres divisiones (todas las de 362 harían la prueba muy lenta), con la escala de 400 km
const proCat = readFileSync('src/data/proPackCatalog.ts', 'utf8');
const proDivs = [...proCat.matchAll(/id: '(div:[a-z]{2}-[a-z0-9-]+)', kind: 'division'.*?lat: (-?[\d.]+), lon: (-?[\d.]+).*?region: '(\w+)'/g)].map((m) => ({ id: m[1], geom: 'area', lat: +m[2], lon: +m[3], mode: m[4] })).filter((_, i) => i % 3 === 0);
if (proDivs.length < 100) throw new Error(`divisiones de los packs Pro no encontradas (${proDivs.length})`);

let seed = 4242;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let n = 0, kmDiff = 0, closeDiff = 0, insideCount = 0, lineZero = 0, divPts = 0;
const bad = [];
for (const it of [...items, ...divisions, ...proDivs]) {
  const sh = it.id.startsWith('div:co-') ? packShapes[it.id] : it.id.startsWith('div:') ? proShapes[it.id] : shapes[it.id];
  const spread = it.mode === 'world' ? 8 : 3;
  const pts = [[it.lat, it.lon]];
  for (let i = 0; i < (it.mode === 'world' ? 4 : 8); i++) pts.push([it.lat + (rnd() - 0.5) * spread, it.lon + (rnd() - 0.5) * spread]);
  if (sh) {
    const all = sh.rings.flat();
    for (let i = 0; i < 4; i++) { const v = all[Math.floor(rnd() * all.length)]; pts.push([v[1] + (rnd() - 0.5) * 1.5, v[0] + (rnd() - 0.5) * 1.5]); }
    pts.push([all[0][1], all[0][0]]); // un vértice exacto: en una línea debe dar 0 km
  }
  for (let i = 0; i < 2; i++) pts.push([rnd() * 140 - 60, rnd() * 360 - 180]);
  const scale = scaleForMode(it.mode);
  for (const [lat, lon] of pts) {
    const ts = fsc.featureDistance(it, lat, lon);
    const { rows } = await db.query('select coalesce(public.shape_distance_km($1, $2, $3), public.geo_distance_km($2, $3, $4, $5)) as km, public.mode_scale_km($6) as scale', [it.id, lat, lon, it.lat, it.lon, it.mode]);
    const sql = rows[0].km;
    n++;
    if (it.mode !== 'world') divPts++;
    if (rows[0].scale !== scale) { closeDiff++; if (bad.length < 8) bad.push(`escala ${it.mode}: ts ${scale} sql ${rows[0].scale}`); }
    if (ts.inside) insideCount++;
    if (sh?.line && ts.km === 0) lineZero++;
    if (Math.abs(ts.km - sql) > 1e-9) { kmDiff++; if (bad.length < 8) bad.push(`${it.id} (${lat.toFixed(3)}, ${lon.toFixed(3)}): ts ${ts.km} sql ${sql}`); }
    const { rows: cl } = await db.query('select public.score_closeness_v2($1, $2) as c', [sql, rows[0].scale]);
    if (closeness(ts.km, scale) !== cl[0].c) closeDiff++;
  }
}
console.log(`puntos ${n} (${divPts} en divisiones de packs, ${insideCount} dentro, ${lineZero} sobre un río) · distancias distintas ${kmDiff} · cercanías distintas ${closeDiff}`);
if (bad.length) console.log(bad.join('\n'));
process.exit(kmDiff || closeDiff ? 1 : 0);

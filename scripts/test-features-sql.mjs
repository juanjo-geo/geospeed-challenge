/**
 * Paridad de la distancia a un lugar geográfico (Fase 6b) entre el teléfono (src/lib/featureScoring.ts) y el
 * servidor (shape_distance_km con is_line, migración de lugares) en un PostgreSQL embebido (PGlite): miles de
 * puntos alrededor de cada contorno (áreas, ríos y lugares puntuales) deben dar la misma distancia y la misma
 * cercanía en los dos lados.
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

const dir = mkdtempSync(join(tmpdir(), 'geospeed-features-'));
await build({ entryPoints: ['src/lib/featureScoring.ts', 'src/lib/scoring.ts'], bundle: true, format: 'esm', outdir: dir, alias: { '@': resolve('src') }, external: ['react'], logLevel: 'warning' });
const fsc = await import(pathToFileURL(join(dir, 'featureScoring.js')).href);
const { closeness } = await import(pathToFileURL(join(dir, 'scoring.js')).href);
const shapes = JSON.parse(readFileSync('src/data/featureShapes.json', 'utf8'));
fsc.__setFeatureShapes(shapes);

const sv2 = readFileSync(SCORING, 'utf8');
const fl = readFileSync(FLAGS, 'utf8');
const ft = readFileSync(FEATURES, 'utf8');
const slice = (s, a, b) => s.slice(s.indexOf(a), b ? s.indexOf(b) : undefined);
const db = new PGlite();
await db.exec('create role anon; create role authenticated;');
await db.exec(sv2.slice(0, sv2.indexOf('-- ── 2) Columnas nuevas')));
await db.exec(slice(sv2, '-- ── 3) Funciones del puntaje', '-- ── 4) save_game_result'));
await db.exec(slice(fl, 'create table if not exists public.place_shapes', '-- ── C) _score_rounds_v2'));
await db.exec(slice(ft, '-- ── A)', '-- ── C)'));
await db.exec(slice(ft, '-- ── D)'));

const cat = readFileSync('src/data/featureCatalog.ts', 'utf8');
const items = [...cat.matchAll(/id: '(feat:[a-z0-9-]+)', kind: 'feature', ftype: '\w+', geom: '(\w+)'.*?lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map((m) => ({ id: m[1], geom: m[2], lat: +m[3], lon: +m[4] }));
if (items.length < 300) throw new Error(`catálogo de lugares no encontrado (${items.length})`);

let seed = 4242;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let n = 0, kmDiff = 0, closeDiff = 0, insideCount = 0, lineZero = 0;
const bad = [];
for (const it of items) {
  const sh = shapes[it.id];
  const pts = [[it.lat, it.lon]];
  for (let i = 0; i < 4; i++) pts.push([it.lat + (rnd() - 0.5) * 8, it.lon + (rnd() - 0.5) * 8]);
  if (sh) {
    const all = sh.rings.flat();
    for (let i = 0; i < 4; i++) { const v = all[Math.floor(rnd() * all.length)]; pts.push([v[1] + (rnd() - 0.5) * 1.5, v[0] + (rnd() - 0.5) * 1.5]); }
    pts.push([all[0][1], all[0][0]]); // un vértice exacto: en una línea debe dar 0 km
  }
  for (let i = 0; i < 2; i++) pts.push([rnd() * 140 - 60, rnd() * 360 - 180]);
  for (const [lat, lon] of pts) {
    const ts = fsc.featureDistance(it, lat, lon);
    const { rows } = await db.query('select coalesce(public.shape_distance_km($1, $2, $3), public.geo_distance_km($2, $3, $4, $5)) as km', [it.id, lat, lon, it.lat, it.lon]);
    const sql = rows[0].km;
    n++;
    if (ts.inside) insideCount++;
    if (sh?.line && ts.km === 0) lineZero++;
    if (Math.abs(ts.km - sql) > 1e-9) { kmDiff++; if (bad.length < 8) bad.push(`${it.id} (${lat.toFixed(3)}, ${lon.toFixed(3)}): ts ${ts.km} sql ${sql}`); }
    const { rows: cl } = await db.query('select public.score_closeness_v2($1, 1500) as c', [sql]);
    if (closeness(ts.km, 1500) !== cl[0].c) closeDiff++;
  }
}
console.log(`puntos ${n} (${insideCount} dentro, ${lineZero} sobre un río) · distancias distintas ${kmDiff} · cercanías distintas ${closeDiff}`);
if (bad.length) console.log(bad.join('\n'));
process.exit(kmDiff || closeDiff ? 1 : 0);

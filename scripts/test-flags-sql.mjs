/**
 * Paridad de la distancia al país (banderas, Fase 6) entre el teléfono (src/lib/flagScoring.ts) y el servidor
 * (shape_distance_km, migración de banderas) en un PostgreSQL embebido (PGlite): miles de puntos sobre los
 * contornos de countries.ts deben dar la misma distancia (y la misma cercanía) en los dos lados.
 *
 * Uso: npm run test:flags-sql
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';

const SCORING = 'supabase/migrations/20261021120000_scoring_v2.sql';
const FLAGS = 'supabase/migrations/20261027120000_flags.sql';

const dir = mkdtempSync(join(tmpdir(), 'geospeed-flags-'));
await build({ entryPoints: ['src/lib/flagScoring.ts', 'src/lib/scoring.ts'], bundle: true, format: 'esm', outdir: dir, alias: { '@': resolve('src') }, logLevel: 'warning' });
const { countryDistance } = await import(pathToFileURL(join(dir, 'flagScoring.js')).href);
const { closeness } = await import(pathToFileURL(join(dir, 'scoring.js')).href);

const sv2 = readFileSync(SCORING, 'utf8');
const fl = readFileSync(FLAGS, 'utf8');
const slice = (s, a, b) => s.slice(s.indexOf(a), b ? s.indexOf(b) : undefined);
const db = new PGlite();
await db.exec('create role anon; create role authenticated;');
await db.exec(sv2.slice(0, sv2.indexOf('-- ── 2) Columnas nuevas')));
await db.exec(slice(sv2, '-- ── 3) Funciones del puntaje', '-- ── 4) save_game_result'));
await db.exec(slice(fl, 'create table if not exists public.place_shapes', '-- ── C) _score_rounds_v2'));
await db.exec(slice(fl, '-- ── H) Seed'));

const cs = readFileSync('src/data/countries.ts', 'utf8');
const countries = JSON.parse(cs.slice(cs.indexOf('= [') + 2, cs.lastIndexOf('];') + 1));
const cat = readFileSync('src/data/flagCatalog.ts', 'utf8');
const items = [...cat.matchAll(/id: '(flag:[A-Z]{2})'.*?name: '((?:[^'\\]|\\.)*)'.*?lat: (-?[\d.]+), lon: (-?[\d.]+)/g)].map((m) => ({ id: m[1], name: m[2].replace(/\\'/g, "'"), lat: +m[3], lon: +m[4] }));
if (items.length < 100) throw new Error('catálogo de banderas no encontrado');

let seed = 12345;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let n = 0, kmDiff = 0, closeDiff = 0, insideCount = 0;
const bad = [];
for (const it of items) {
  const c = countries.find((x) => x.name === it.name);
  const pts = [];
  for (let i = 0; i < 4; i++) pts.push([it.lat + (rnd() - 0.5) * 6, it.lon + (rnd() - 0.5) * 6]);
  const all = c.polygons.flat();
  for (let i = 0; i < 4; i++) { const v = all[Math.floor(rnd() * all.length)]; pts.push([v[1] + (rnd() - 0.5) * 2, v[0] + (rnd() - 0.5) * 2]); }
  for (let i = 0; i < 2; i++) pts.push([rnd() * 140 - 60, rnd() * 360 - 180]);
  pts.push([all[0][1], all[0][0]]);
  for (const [lat, lon] of pts) {
    const ts = countryDistance(it.name, lat, lon);
    const { rows } = await db.query('select public.shape_distance_km($1, $2, $3) as km', [it.id, lat, lon]);
    const sql = rows[0].km;
    n++;
    if (ts.inside) insideCount++;
    if (Math.abs(ts.km - sql) > 1e-9) { kmDiff++; if (bad.length < 8) bad.push(`${it.name} (${lat.toFixed(3)}, ${lon.toFixed(3)}): ts ${ts.km} sql ${sql}`); }
    const { rows: cl } = await db.query('select public.score_closeness_v2($1, 1500) as c', [sql]);
    if (closeness(ts.km, 1500) !== cl[0].c) closeDiff++;
  }
}
console.log(`puntos ${n} (${insideCount} dentro) · distancias distintas ${kmDiff} · cercanías distintas ${closeDiff}`);
if (bad.length) console.log(bad.join('\n'));
process.exit(kmDiff || closeDiff ? 1 : 0);

/**
 * Equivalencia del puntaje v2 entre el teléfono (src/lib/scoring.ts) y el servidor (_score_rounds_v2 de la
 * migración scoring_v2), en un PostgreSQL embebido (PGlite). Correrlo cada vez que se toque la fórmula en
 * cualquiera de los dos lados.
 *
 * Uso: npm run test:scoring-sql
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = 'supabase/migrations/20261021120000_scoring_v2.sql';

// scoring.ts → módulo ESM temporal
const out = join(mkdtempSync(join(tmpdir(), 'geospeed-scoring-')), 'scoring.mjs');
await build({ entryPoints: ['src/lib/scoring.ts'], bundle: true, format: 'esm', outfile: out, logLevel: 'warning' });
const { closeness, scaleForMode, scoreRound, difficultyHundredths } = await import(pathToFileURL(out).href);

// Haversine idéntico a src/lib/gameUtils.ts (verificado abajo contra el archivo)
const gu = readFileSync('src/lib/gameUtils.ts', 'utf8');
if (!gu.includes('return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));')) throw new Error('haversineDistance cambió: actualizar esta prueba');
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const mig = readFileSync(MIGRATION, 'utf8');
const db = new PGlite();
await db.exec('create role anon; create role authenticated;');
await db.exec(mig.slice(0, mig.indexOf('-- ── 2) Columnas nuevas')));
await db.exec(mig.slice(mig.indexOf('-- ── 3) Funciones del puntaje'), mig.indexOf('-- ── 4) save_game_result')));

const src = readFileSync('src/data/cities.ts', 'utf8');
const re = /\{ id: "([^"]+)", name: "([^"]+)", country: "([^"]+)", lat: (-?[\d.]+), lon: (-?[\d.]+)/g;
const places = []; const seen = new Set(); let m;
while ((m = re.exec(src))) if (!seen.has(m[1])) { seen.add(m[1]); places.push({ id: m[1], name: m[2], country: m[3], lat: +m[4], lon: +m[5] }); }
const seeded = (await db.query('select count(*)::int n from public.places')).rows[0].n;
if (seeded !== places.length) throw new Error(`La semilla tiene ${seeded} lugares y el catálogo ${places.length}: correr node scripts/build-places.mjs y migrar`);

let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
let fails = 0, rounds = 0;
for (let g = 0; g < 1500; g++) {
  const mode = pick(['world', 'europe', 'asia', 'americas', 'africa']);
  const diff = pick(['basic', 'easy', 'medium', 'hard']);
  const payload = []; const js = []; let combo = 0;
  for (let i = 0, n = 1 + Math.floor(rnd() * 15); i < n; i++) {
    const p = pick(places);
    const spread = rnd() < 0.6 ? rnd() * 1.5 : rnd() * 40;
    const clat = Math.max(-85, Math.min(85, p.lat + (rnd() - 0.5) * spread));
    const clon = p.lon + (rnd() - 0.5) * spread;
    const t = Math.round(rnd() * 150) / 10;
    const sc = scoreRound(closeness(haversineDistance(clat, clon, p.lat, p.lon), scaleForMode(mode)), t, combo, difficultyHundredths(diff));
    combo = sc.combo; js.push(sc.points); rounds++;
    payload.push({ round_no: i + 1, place_id: p.id, click_lat: clat, click_lon: clon, time_s: t });
  }
  const res = (await db.query(`select total, rounds from public._score_rounds_v2($1::jsonb, $2, $3, 'classic')`, [JSON.stringify(payload), mode, diff])).rows[0];
  const sql = res.rounds.map((r) => r.points);
  if (res.total !== js.reduce((a, b) => a + b, 0) || sql.some((v, i) => v !== js[i])) {
    fails++;
    if (fails <= 5) console.log('DIFERENCIA', mode, diff, js, sql);
  }
}
await db.close();
writeFileSync(out, '');
console.log(`${rounds} rondas comparadas, diferencias: ${fails}`);
process.exit(fails ? 1 : 0);

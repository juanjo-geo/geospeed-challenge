// node scripts/store-shots/dump-catalog.mjs  →  catalog.json junto a este script (nombre → coordenadas para capture.mjs)
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const outfile = join(here, 'catalog-bundle.mjs');
await build({
  entryPoints: [join(here, 'catalog-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  absWorkingDir: repo,
  alias: { '@': join(repo, 'src') },
  define: { 'import.meta.env': '{"DEV":false,"PROD":true,"VITE_SUPABASE_URL":"https://example.supabase.co","VITE_SUPABASE_PUBLISHABLE_KEY":"x"}' },
  loader: { '.json': 'json' },
  logLevel: 'error',
  banner: { js: 'const __mem = new Map(); globalThis.localStorage = { getItem: (k) => __mem.get(k) ?? null, setItem: (k, v) => __mem.set(k, String(v)), removeItem: (k) => __mem.delete(k), key: () => null, length: 0, clear: () => __mem.clear() }; globalThis.sessionStorage = globalThis.localStorage;' },
});
const json = execFileSync(process.execPath, [outfile], { maxBuffer: 64 * 1024 * 1024 }).toString();
writeFileSync(join(here, 'catalog.json'), json);
const data = JSON.parse(json);
console.log(Object.entries(data).map(([k, v]) => `${k}: ${v.length}`).join(' · '));

// Genera api/_ogAssets.ts: la fuente Poppins (600 y 800, .woff latin de @fontsource) y el Explorador
// (scripts/og-assets/explorer.png) en base64, para que la imagen de la vista previa del diario
// (api/og-daily.ts) no tenga que pedir archivos al propio sitio (en las versiones de prueba de Vercel
// esas peticiones pueden exigir inicio de sesión). Ejecutar si cambian la fuente o la mascota:
//   node scripts/build-og-assets.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const b64 = (rel) => readFileSync(root + rel).toString('base64');

const assets = {
  POPPINS_600: b64('node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff'),
  POPPINS_800: b64('node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff'),
  EXPLORER_PNG: b64('scripts/og-assets/explorer.png'),
};

const out = [
  '// Generado por scripts/build-og-assets.mjs — no editar a mano.',
  '// Poppins: SIL Open Font License 1.1 (@fontsource/poppins). Explorador: mascota de GeoSpeed.',
  ...Object.entries(assets).map(([k, v]) => `export const ${k} = '${v}';`),
  '',
].join('\n');
writeFileSync(root + 'api/_ogAssets.ts', out);
console.log('api/_ogAssets.ts', Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, `${Math.round(v.length / 1024)} KB`])));

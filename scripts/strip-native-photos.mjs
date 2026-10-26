/**
 * App nativa (Fase 11): el paquete base debe quedar en máximo 30 MB, así que antes de `npx cap sync` se sacan de dist/
 * las fotos (países, ciudades y monumentos, ~80 MB). En Android/iOS se piden al sitio publicado (src/lib/assetUrl.ts);
 * sin señal no se muestran (son decorativas: CountryPhoto deja su espacio vacío).
 *
 * Uso: npm run build:native   (= vite build + este script; después `npx cap sync android`)
 */
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let freed = 0;
const size = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((n, f) => n + size(join(p, f)), 0) : statSync(p).size);
for (const dir of ['countries', 'cities', 'landmarks']) {
  const p = join(dist, dir);
  if (!existsSync(p)) continue;
  freed += size(p);
  rmSync(p, { recursive: true, force: true });
}
const total = size(dist);
console.log(`Fotos fuera del paquete nativo: ${(freed / 1048576).toFixed(1)} MB. dist/ queda en ${(total / 1048576).toFixed(1)} MB.`);
if (total > 30 * 1048576) {
  console.error('El paquete base supera 30 MB.');
  process.exit(1);
}

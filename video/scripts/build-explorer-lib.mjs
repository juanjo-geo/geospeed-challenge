// Escribe src/explorerLib.ts con las medidas de cada clip recortado de la biblioteca del Explorador
// (public/explorer_<nombre>/meta.json, que deja scripts/key_clip.py).
// Uso (desde video/):  node scripts/build-explorer-lib.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Cuadro del clip (24 por segundo) donde empieza lo mejor de cada reacción, para el cierre de 2 s
const START = {
  celebra: 40, baile: 70, saluda: 18, 'te-reta': 28, presenta: 40, idea: 60, confundido: 50, sorpresa: 30,
  triste: 20, 'otra-vez': 50, mapa: 40, despierta: 60, risa: 25, apurado: 60,
};
const lib = {};
for (const [name, start] of Object.entries(START)) {
  const f = `public/explorer_${name}/meta.json`;
  if (!existsSync(f)) { console.warn('falta', f); continue; }
  const m = JSON.parse(readFileSync(f, 'utf8'));
  lib[name] = { w: m.w, h: m.h, pose: m.pose, feet: m.feet, last: m.frames - 1, start };
}
const out = `// Generado por scripts/build-explorer-lib.mjs: no editar a mano.
// Biblioteca de reacciones del Explorador (Higgsfield, Seedance 2.0, 2026-11-20), recortadas por scripts/key_clip.py.
export const EXPLORER_LIB = ${JSON.stringify(lib, null, 2)} as const;
export type LibClipId = keyof typeof EXPLORER_LIB;
`;
writeFileSync('src/explorerLib.ts', out);
console.log(Object.keys(lib).length, 'clips');

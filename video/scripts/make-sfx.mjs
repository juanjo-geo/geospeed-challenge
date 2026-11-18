// Efectos de sonido del video, sintetizados (sin archivos de terceros: no hay licencias que revisar).
// Uso: node video/scripts/make-sfx.mjs  →  video/public/sfx/*.wav (44,1 kHz, 16 bits, mono)
// Mismo estilo que los del juego: campanas que suben de tono con el combo, golpes suaves, barridos de aire.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/sfx');
mkdirSync(OUT, { recursive: true });

let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const TAU = Math.PI * 2;

/** Suma un tono con caída exponencial. f puede ser función del tiempo (barrido). */
function tone(out, { at = 0, f, dur, amp = 0.5, decay = 6, attack = 0.004, shape = 'sine' }) {
  let ph = 0;
  const n0 = Math.floor(at * SR), n = Math.floor(dur * SR);
  for (let i = 0; i < n && n0 + i < out.length; i++) {
    const t = i / SR;
    const freq = typeof f === 'function' ? f(t / dur) : f;
    ph += (TAU * freq) / SR;
    const env = Math.min(1, t / attack) * Math.exp(-decay * t) * Math.min(1, (dur - t) / 0.01);
    const s = shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph);
    out[n0 + i] += s * env * amp;
  }
}
/** Campana: fundamental + parciales que se apagan más rápido */
function bell(out, { at = 0, f, dur = 0.7, amp = 0.4 }) {
  tone(out, { at, f, dur, amp, decay: 5 });
  tone(out, { at, f: f * 2, dur: dur * 0.8, amp: amp * 0.45, decay: 8 });
  tone(out, { at, f: f * 3.01, dur: dur * 0.6, amp: amp * 0.22, decay: 12 });
  tone(out, { at, f: f * 4.2, dur: dur * 0.4, amp: amp * 0.12, decay: 18 });
}
/** Ruido filtrado (pasa banda que se mueve): aire, barridos, chasquidos */
function swish(out, { at = 0, dur, f0, f1, amp = 0.5, q = 0.6, shape = (x) => Math.sin(Math.PI * x) ** 1.5 }) {
  let low = 0, band = 0;
  const n0 = Math.floor(at * SR), n = Math.floor(dur * SR);
  for (let i = 0; i < n && n0 + i < out.length; i++) {
    const x = i / n;
    const fc = f0 * Math.pow(f1 / f0, x);
    const k = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    const input = noise();
    low += k * band;
    const high = input - low - q * band;
    band += k * high;
    out[n0 + i] += band * shape(x) * amp;
  }
}
function save(name, out, gain = 1) {
  // Normaliza a un pico cómodo y da 5 ms de salida suave
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? (0.85 / peak) * gain : 1;
  const fadeN = Math.floor(0.005 * SR);
  const pcm = Buffer.alloc(44 + out.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + out.length * 2, 4); pcm.write('WAVEfmt ', 8);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(out.length * 2, 40);
  for (let i = 0; i < out.length; i++) {
    const tail = Math.min(1, (out.length - i) / fadeN);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i] * g * tail)) * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, name + '.wav'), pcm);
  console.log(name.padEnd(14), (out.length / SR).toFixed(2) + ' s');
}
const NOTE = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);

// Reloj: tic y tac de madera
for (const [name, f] of [['tick', 1900], ['tock', 1450]]) {
  const o = buf(0.09);
  tone(o, { f, dur: 0.07, amp: 0.6, decay: 70 });
  swish(o, { dur: 0.012, f0: 3000, f1: 5000, amp: 0.5, shape: (x) => 1 - x });
  save(name, o, 0.8);
}
// Barridos de aire: corto (entra un teléfono), largo (gira el globo), grave (vuelo a Colombia)
{ const o = buf(0.34); swish(o, { dur: 0.32, f0: 500, f1: 3200, amp: 0.7 }); save('whoosh', o); }
{ const o = buf(0.62); swish(o, { dur: 0.6, f0: 300, f1: 2400, amp: 0.7 }); swish(o, { dur: 0.6, f0: 2400, f1: 500, amp: 0.3 }); save('whoosh-long', o); }
{ const o = buf(1.1); swish(o, { dur: 1.05, f0: 120, f1: 1500, amp: 0.8, q: 0.4 }); tone(o, { f: (x) => 50 + 40 * x, dur: 1.0, amp: 0.35, decay: 1.2, attack: 0.3 }); save('whoosh-deep', o); }
// Golpe del pin
{ const o = buf(0.3); tone(o, { f: (x) => 170 - 110 * x, dur: 0.26, amp: 0.9, decay: 13 }); swish(o, { dur: 0.03, f0: 1500, f1: 600, amp: 0.5, shape: (x) => 1 - x }); save('thud', o); }
// Aciertos: la campana sube de tono con el combo (como en el juego)
[0, 2, 5, 9].forEach((semi, i) => {
  const o = buf(0.9);
  bell(o, { f: NOTE(12 + semi), dur: 0.85, amp: 0.5 });
  bell(o, { at: 0.07, f: NOTE(19 + semi), dur: 0.7, amp: 0.32 });
  save('ding-' + (i + 1), o);
});
// ¡PERFECTO!: tres campanas que suben
{ const o = buf(1.1); [12, 16, 19, 24].forEach((s, i) => bell(o, { at: i * 0.075, f: NOTE(s), dur: 0.8, amp: 0.42 })); save('perfect', o); }
// Contador de puntos subiendo
{ const o = buf(0.7); for (let i = 0; i < 14; i++) tone(o, { at: i * 0.045, f: NOTE(7 + i), dur: 0.05, amp: 0.35, decay: 40, shape: 'tri' }); save('count', o, 0.7); }
// Aparece una tarjeta
{ const o = buf(0.16); tone(o, { f: (x) => 380 + 620 * x, dur: 0.11, amp: 0.7, decay: 16 }); save('pop', o); }
// Llamas: bocanada + golpe grave
{ const o = buf(1.3);
  swish(o, { dur: 1.2, f0: 250, f1: 1800, amp: 0.8, q: 0.35, shape: (x) => Math.min(1, x * 12) * Math.exp(-2.6 * x) });
  for (let i = 0; i < 40; i++) swish(o, { at: 0.05 + rnd() * 1.0, dur: 0.012, f0: 2500, f1: 6000, amp: 0.25 * (1 - i / 60), shape: (x) => 1 - x });
  tone(o, { f: (x) => 110 - 65 * x, dur: 0.6, amp: 0.95, decay: 6 });
  save('fire', o); }
// Departamentos subiendo en cascada
{ const o = buf(1.5); const scale = [0, 2, 4, 7, 9];
  for (let i = 0; i < 32; i++) tone(o, { at: i * 0.041, f: NOTE(3 + scale[i % 5] + 12 * Math.floor(i / 10)), dur: 0.09, amp: 0.3, decay: 28, shape: 'tri' });
  save('cascade', o, 0.75); }
// Fichas del diario: caen (13 clacs) y se voltean (13 tics que suben)
{ const o = buf(1.1);
  for (let i = 0; i < 13; i++) { const at = i * 0.0667; tone(o, { at, f: 240 + rnd() * 60, dur: 0.05, amp: 0.6, decay: 45 }); swish(o, { at, dur: 0.02, f0: 1800, f1: 2600, amp: 0.5, shape: (x) => 1 - x }); }
  save('chips-fall', o, 0.8); }
{ const o = buf(1.0);
  for (let i = 0; i < 13; i++) tone(o, { at: i * 0.0533, f: NOTE(12 + i), dur: 0.06, amp: 0.4, decay: 38 });
  save('chips-flip', o, 0.7); }
// Racha +1
{ const o = buf(0.9); [12, 16, 19].forEach((s, i) => bell(o, { at: i * 0.06, f: NOTE(s + 5), dur: 0.6, amp: 0.4 })); save('streak', o); }
// Mensaje (burbuja de chat) y aviso de que el rival respondió
{ const o = buf(0.35); tone(o, { f: NOTE(7), dur: 0.12, amp: 0.5, decay: 14 }); tone(o, { at: 0.11, f: NOTE(12), dur: 0.2, amp: 0.5, decay: 10 }); save('message', o); }
{ const o = buf(0.4); tone(o, { f: NOTE(15), dur: 0.09, amp: 0.5, decay: 22, shape: 'tri' }); tone(o, { at: 0.13, f: NOTE(15), dur: 0.14, amp: 0.5, decay: 16, shape: 'tri' }); save('notify', o); }
// Salto del Explorador
{ const o = buf(0.32); tone(o, { f: (x) => 300 + 520 * x * x, dur: 0.24, amp: 0.7, decay: 7, shape: 'tri' }); save('jump', o); }
// Cierre: golpe + acorde mayor que se queda sonando
{ const o = buf(2.8);
  tone(o, { f: (x) => 120 - 75 * x, dur: 0.7, amp: 0.9, decay: 5 });
  [-12, 0, 4, 7, 12, 16].forEach((s, i) => bell(o, { at: i * 0.012, f: NOTE(s), dur: 2.6, amp: 0.3 }));
  for (let i = 0; i < 7; i++) bell(o, { at: 0.25 + i * 0.09, f: NOTE([24, 28, 31, 36, 31, 28, 36][i]), dur: 0.9, amp: 0.1 });
  save('finale', o); }
// Destello (lema del cierre, río que se enciende)
{ const o = buf(0.9); for (let i = 0; i < 7; i++) bell(o, { at: i * 0.06, f: NOTE([24, 31, 28, 36, 33, 40, 36][i]), dur: 0.5, amp: 0.2 }); save('sparkle', o, 0.7); }

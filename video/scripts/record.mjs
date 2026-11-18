// Graba una partida real del juego en video (cuadros + tiempos) para el video de lanzamiento.
// Uso (desde la raíz, con `npm run build` normal hecho): node video/scripts/record.mjs <nombre> <semilla> [rondas]
// Sale video/rec/<nombre>/frames/*.jpg, frames.json (tiempo de cada cuadro) y events.json (pregunta, toque, tarjeta…).
// Igual que las capturas de Play: se sirve dist/ con el dominio de producción y Supabase/Analytics quedan bloqueados.
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage, sleep } from '../../scripts/store-shots/cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const NAME = process.argv[2] || 'clasico';
const SEED = Number(process.argv[3] || 1012);
const ROUNDS = Number(process.argv[4] || 9);
const DIFF = process.env.DIFF || 'easy';
const VW = Number(process.env.VW || 844), VH = Number(process.env.VH || 390);
const OUT = resolve(here, '../rec', NAME);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'frames'), { recursive: true });
const ORIGIN = 'https://geospeed-challenge.vercel.app';
const DIST = resolve(here, '../../dist');
const catalog = JSON.parse(readFileSync(resolve(here, '../../scripts/store-shots/catalog.json'), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
function localFile(url) {
  const u = new URL(url);
  let file = join(DIST, decodeURIComponent(u.pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) file = extname(u.pathname) ? null : join(DIST, 'index.html');
  if (!file || !existsSync(file)) return { code: 404, type: 'text/plain', body: Buffer.from('') };
  return { code: 200, type: MIME[extname(file).toLowerCase()] || 'application/octet-stream', body: readFileSync(file) };
}
const MODE = process.env.MODE || 'world';   // 'world' (ciudades, con semilla) o 'colombia' (departamentos)
const B = MODE === 'colombia' ? { latMin: -4.6, latMax: 13.7, lonMin: -82.2, lonMax: -66.6 } : { latMin: -62, latMax: 85, lonMin: -180, lonMax: 180 };
const POOL = MODE === 'colombia' ? 'colombia:divisions' : 'world:cities';
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const lookup = (title) => catalog[POOL].find((it) => [it.titleEs, it.titleEn, it.name, it.nameEn].some((n) => norm(n) === norm(title)));

// Escala 2 real del navegador (no emulada): así la grabación sale a 1688×780
const b = await launch({ profileRoot: resolve(here, '../rec'), args: ['--force-device-scale-factor=2', `--window-size=${VW},${VH}`] });
const p = await openPage(b, { width: VW, height: VH, scale: 0, mobile: true, touch: true });
await p.s('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' }, { urlPattern: ORIGIN + '/*' }] });
await p.s('Network.enable');
await p.s('Network.setBypassServiceWorker', { bypass: true });

const t0 = Date.now();
const events = [];
const mark = (type, extra = {}) => { events.push({ t: (Date.now() - t0) / 1000, type, ...extra }); };
const frames = [];
let recording = false;
b.on((msg) => {
  if (msg.sessionId !== p.sessionId) return;
  if (msg.method === 'Fetch.requestPaused') {
    const { requestId, request } = msg.params;
    if (request.url.startsWith(ORIGIN + '/')) {
      const f = localFile(request.url);
      b.send('Fetch.fulfillRequest', { requestId, responseCode: f.code, responseHeaders: [{ name: 'Content-Type', value: f.type }, { name: 'Cache-Control', value: 'no-store' }], body: f.body.toString('base64') }, p.sessionId).catch(() => {});
    } else {
      b.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }, p.sessionId).catch(() => {});
    }
  } else if (msg.method === 'Page.screencastFrame') {
    const { data, sessionId: ack } = msg.params;
    b.send('Page.screencastFrameAck', { sessionId: ack }, p.sessionId).catch(() => {});
    if (!recording) return;
    const i = frames.length;
    frames.push((Date.now() - t0) / 1000);
    writeFileSync(join(OUT, 'frames', String(i).padStart(5, '0') + '.jpg'), Buffer.from(data, 'base64'));
  }
});
await p.s('Page.addScriptToEvaluateOnNewDocument', { source: `try {
  if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('sin service worker'));
  const set = (k, v) => { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); };
  set('geospeed_locale', '${process.env.LOCALE === 'en' ? 'en' : 'es'}'); set('geospeed_tutorial_seen', '1'); set('geospeed_onboarding_done', '1');
  set('geospeed_map_drag_learned', '1'); set('geospeed_music_muted', '1');
  ${MODE === 'colombia' ? "set('geospeed_last_selection', JSON.stringify({ mode: 'colombia', difficulty: 'basic', category: 'divisions' }));" : ''}
} catch (e) {}` });
const waitFor = async (expr, timeout = 30000, every = 40) => {
  const s = Date.now();
  while (Date.now() - s < timeout) {
    try { const v = await p.evaluate(expr); if (v) return v; } catch { /* cargando */ }
    await sleep(every);
  }
  throw new Error('timeout: ' + expr.slice(0, 80));
};
const READ_PROMPT = `(() => {
  const root = document.querySelector('[data-game-container]'); if (!root) return null;
  let title = null;
  for (const s of root.querySelectorAll('span')) {
    const t = (s.textContent || '').trim();
    if (/^(¿Dónde está|Where is)/.test(t)) { const h = s.querySelector('.text-primary'); if (h && h.textContent.trim()) { title = h.textContent.trim(); break; } }
  }
  const cs = [...root.querySelectorAll('canvas')].map(c => ({ r: c.getBoundingClientRect() })).filter(o => o.r.width > 150).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height);
  if (!cs.length || !title) return null;
  const r = cs[0].r;
  return { title, box: { left: r.left, top: r.top, w: r.width, h: r.height } };
})()`;
const NEXT = /^(SIGUIENTE|NEXT)/i;
const hasNext = `(() => { const re = ${NEXT}; return [...document.querySelectorAll('button')].some(b => b.offsetParent !== null && re.test((b.innerText || '').trim())); })()`;
const clickNext = `(() => { const re = ${NEXT}; const e = [...document.querySelectorAll('button')].find(b => b.offsetParent !== null && re.test((b.innerText || '').trim())); if (!e) return false; e.click(); return true; })()`;

await p.navigate(MODE === 'colombia' ? ORIGIN + '/' : `${ORIGIN}/?ch=${SEED}&d=${DIFF}&m=world`);
await waitFor(`document.readyState !== 'loading' && !!document.body`, 20000);
await sleep(300);
if (MODE === 'colombia') {
  const PLAY = /^(JUGAR AHORA|PLAY NOW)$/i;
  await waitFor(`(() => { const re = ${PLAY}; return [...document.querySelectorAll('button')].some(b => re.test((b.innerText || '').trim())); })()`, 40000);
  await sleep(1200);
  await p.evaluate(`(() => { const re = ${PLAY}; const e = [...document.querySelectorAll('button')].find(b => re.test((b.innerText || '').trim())); e.click(); return true; })()`);
}
await p.s('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1, maxWidth: VW * 2, maxHeight: VH * 2 });
recording = true;
mark('start');

let last = null;
for (let round = 1; round <= ROUNDS; round++) {
  const prompt = await waitFor(`(() => { const v = ${READ_PROMPT}; return v && v.title !== ${JSON.stringify(last)} ? v : null; })()`);
  last = prompt.title;
  mark('prompt', { round, title: prompt.title });
  const it = lookup(prompt.title);
  if (!it) throw new Error('sin coordenadas para ' + prompt.title);
  // Ronda 1: 1,5 s para que quien mira alcance a pensar; las demás, rápidas (combo)
  await sleep(round === 1 ? 1500 : 850);
  // La caja del mapa se vuelve a medir justo antes de tocar (al empezar la partida el lienzo aún cambia de tamaño)
  const { left, top, w, h } = (await p.evaluate(READ_PROMPT)).box;
  const lonR = B.lonMax - B.lonMin, latR = B.latMax - B.latMin;
  const scale = Math.min(w / lonR, h / latR);
  const ox = (w - lonR * scale) / 2, oy = (h - latR * scale) / 2;
  const x = left + ox + (it.lon - B.lonMin) * scale, y = top + oy + (B.latMax - it.lat) * scale;
  // Toque con el dedo (coordenadas con decimales: 1 px del mapa son ~45 km)
  const pt = [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }];
  await p.s('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt });
  await p.s('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  mark('tap', { round, x, y });
  await waitFor(hasNext, 15000);
  const card = await p.evaluate(`(() => { const t = document.body.innerText.split(String.fromCharCode(10)).join(" "); const d = t.match(/(Distancia|Distance) *([0-9.,]+ ?k?m)/); const pt = t.match(/[+]([0-9.,]+) (puntos|points)/); return (d ? d[2] : "?") + " · +" + (pt ? pt[1] : "?"); })()`);
  mark('card', { round, card, box: { left, top, w, h }, x, y });
  await sleep(round === 1 ? 2600 : 1500);
  if (round < ROUNDS) { await p.evaluate(clickNext); mark('next', { round }); }
}
await sleep(600);
recording = false;
await p.s('Page.stopScreencast');
mark('end');
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(frames));
writeFileSync(join(OUT, 'events.json'), JSON.stringify(events, null, 1));
console.log(`${frames.length} cuadros en ${(frames[frames.length - 1] - frames[0]).toFixed(1)} s`);
console.log(events.filter((e) => e.type !== 'next').map((e) => `${e.t.toFixed(2)} ${e.type}${e.round ? ' ' + e.round : ''}${e.title ? ' ' + e.title : ''}`).join('\n'));
await b.close();
process.exit(0);

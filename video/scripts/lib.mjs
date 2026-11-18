// Base común de las grabaciones del video: Chrome sin interfaz sirviendo un build local bajo el dominio de producción,
// con Supabase y Analytics bloqueados (nada llega a producción). dist = carpeta del build:
//  - 'dist' (npm run build): el juego tal cual.
//  - 'video/rec/dist-dev' (NODE_ENV=development npx vite build --mode development --outDir video/rec/dist-dev):
//    el mismo juego con los simuladores de desarrollo (retos y salas sin servidor).
import { writeFileSync, readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage, sleep } from '../../scripts/store-shots/cdp.mjs';

export { sleep };
const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '../..');
export const ORIGIN = 'https://geospeed-challenge.vercel.app';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const catalog = JSON.parse(readFileSync(join(ROOT, 'scripts/store-shots/catalog.json'), 'utf8'));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const lookup = (title, pool = 'world:cities') => catalog[pool].find((it) => [it.titleEs, it.titleEn, it.name, it.nameEn].some((n) => norm(n) === norm(title)));
const WORLD = { latMin: -62, latMax: 85, lonMin: -180, lonMax: 180 };

export const READ_PROMPT = `(() => {
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

/**
 * Abre el navegador y una pestaña. storage = claves de localStorage que se ponen antes de cargar el juego.
 * forceScale = escala real del navegador (la grabación en video sale a ese tamaño); si no, escala emulada.
 */
export async function session({ dist = 'dist', width = 852, height = 393, scale = 2, forceScale = false, mobile = true, storage = {} } = {}) {
  const DIST = resolve(ROOT, dist);
  const localFile = (url) => {
    const u = new URL(url);
    let file = join(DIST, decodeURIComponent(u.pathname));
    if (!existsSync(file) || statSync(file).isDirectory()) file = extname(u.pathname) ? null : join(DIST, 'index.html');
    if (!file || !existsSync(file)) return { code: 404, type: 'text/plain', body: Buffer.from('') };
    return { code: 200, type: MIME[extname(file).toLowerCase()] || 'application/octet-stream', body: readFileSync(file) };
  };
  const b = await launch({ profileRoot: resolve(here, '../rec'), args: forceScale ? [`--force-device-scale-factor=${scale}`, `--window-size=${width},${height}`] : [] });
  const p = await openPage(b, { width, height, scale: forceScale ? 0 : scale, mobile, touch: mobile });
  await p.s('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' }, { urlPattern: ORIGIN + '/*' }] });
  await p.s('Network.enable');
  await p.s('Network.setBypassServiceWorker', { bypass: true });
  const t0 = Date.now();
  const rec = { on: false, dir: null, times: [] };
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
      b.send('Page.screencastFrameAck', { sessionId: msg.params.sessionId }, p.sessionId).catch(() => {});
      if (!rec.on) return;
      writeFileSync(join(rec.dir, 'frames', String(rec.times.length).padStart(5, '0') + '.jpg'), Buffer.from(msg.params.data, 'base64'));
      rec.times.push((Date.now() - t0) / 1000);
    }
  });
  const init = { geospeed_locale: process.env.LOCALE === 'en' ? 'en' : 'es', geospeed_tutorial_seen: '1', geospeed_onboarding_done: '1', geospeed_map_drag_learned: '1', geospeed_music_muted: '1', ...storage };
  await p.s('Page.addScriptToEvaluateOnNewDocument', { source: `try {
    if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('sin service worker'));
    const init = ${JSON.stringify(init)};
    for (const k in init) if (localStorage.getItem(k) === null) localStorage.setItem(k, init[k]);
  } catch (e) {}` });

  const events = [];
  const api = {
    b, p, events,
    now: () => (Date.now() - t0) / 1000,
    mark: (type, extra = {}) => events.push({ t: (Date.now() - t0) / 1000, type, ...extra }),
    evaluate: p.evaluate,
    async waitFor(expr, timeout = 30000, every = 60) {
      const s = Date.now();
      while (Date.now() - s < timeout) { try { const v = await p.evaluate(expr); if (v) return v; } catch { /* cargando */ } await sleep(every); }
      throw new Error('timeout: ' + expr.slice(0, 90));
    },
    async goto(path) {
      await p.navigate(ORIGIN + path);
      await api.waitFor(`document.readyState !== 'loading' && !!document.body`, 20000);
      await sleep(300);
    },
    hasText: (re) => p.evaluate(`[...document.querySelectorAll('button, a, [role=button]')].some(e => e.offsetParent !== null && ${re}.test((e.innerText || '').trim().split(String.fromCharCode(10)).join(' ')))`),
    clickText: (re) => p.evaluate(`(() => { const els = [...document.querySelectorAll('button, a, [role=button]')].filter(e => ${re}.test((e.innerText || '').trim().split(String.fromCharCode(10)).join(' '))); const e = els.find(x => x.offsetParent !== null) || els[0]; if (!e) return false; e.click(); return true; })()`),
    waitText: (re, timeout = 30000) => api.waitFor(`[...document.querySelectorAll('button, a, [role=button]')].some(e => e.offsetParent !== null && ${re}.test((e.innerText || '').trim().split(String.fromCharCode(10)).join(' ')))`, timeout),
    async shot(file) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, await p.screenshot()); console.log('  ✓', file); },
    /** Empieza a guardar la grabación en dir (frames/*.jpg) */
    async startRecording(dir) {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(join(dir, 'frames'), { recursive: true });
      rec.dir = dir; rec.times = []; rec.on = true;
      await p.s('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1, maxWidth: width * 2, maxHeight: height * 2 });
    },
    pauseRecording() { rec.on = false; },
    async stopRecording() {
      rec.on = false;
      await p.s('Page.stopScreencast').catch(() => {});
      writeFileSync(join(rec.dir, 'frames.json'), JSON.stringify(rec.times));
      writeFileSync(join(rec.dir, 'events.json'), JSON.stringify(events, null, 1));
      // Lista para ffmpeg (cada cuadro con su duración real)
      const lines = rec.times.map((t, i) => `file 'frames/${String(i).padStart(5, '0')}.jpg'\nduration ${((rec.times[i + 1] ?? t + 0.033) - t).toFixed(4)}`);
      lines.push(`file 'frames/${String(rec.times.length - 1).padStart(5, '0')}.jpg'`);
      writeFileSync(join(rec.dir, 'list.txt'), lines.join('\n'));
      return rec.times;
    },
    /** Lee la pregunta y toca el lugar correcto en el mapa del mundo (toque de dedo, con decimales) */
    async answer(prompt, pool = 'world:cities') {
      const it = lookup(prompt.title, pool);
      if (!it) throw new Error('sin coordenadas para ' + prompt.title);
      const { left, top, w, h } = (await p.evaluate(READ_PROMPT)).box;
      const lonR = WORLD.lonMax - WORLD.lonMin, latR = WORLD.latMax - WORLD.latMin;
      const sc = Math.min(w / lonR, h / latR);
      const x = left + (w - lonR * sc) / 2 + (it.lon - WORLD.lonMin) * sc, y = top + (h - latR * sc) / 2 + (WORLD.latMax - it.lat) * sc;
      await p.s('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }] });
      await p.s('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    },
    close: () => b.close(),
  };
  return api;
}

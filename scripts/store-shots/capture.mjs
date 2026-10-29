// Capturas reales del juego publicado para la ficha de Google Play (punto 13).
// Uso (desde la raíz, con `npm run build` hecho): node scripts/store-shots/capture.mjs es|en [escena…]
// Escenas: classic flags colombia home daily friends story tablet. Salida: scripts/store-shots/raw/<idioma>/.
// Supabase y Analytics quedan bloqueados: nada se guarda en producción ni ensucia las métricas.
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage, sleep } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LOCALE = process.argv[2] === 'en' ? 'en' : 'es';
const ONLY = process.argv.slice(3);
const OUT = join(here, 'raw', LOCALE);
mkdirSync(OUT, { recursive: true });
const ORIGIN = 'https://geospeed-challenge.vercel.app';
const catalog = JSON.parse(readFileSync(join(here, 'catalog.json'), 'utf8'));
// Por defecto se sirve el build local (dist/) con el dominio de producción: así salen los cambios aún sin
// publicar. REMOTE=1 usa el sitio publicado.
const DIST = resolve(here, '../../dist');
const LOCAL = process.env.REMOTE !== '1';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.wasm': 'application/wasm' };
function localFile(url) {
  const u = new URL(url);
  let file = join(DIST, decodeURIComponent(u.pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) file = extname(u.pathname) ? null : join(DIST, 'index.html');
  if (!file || !existsSync(file)) return { code: 404, type: 'text/plain', body: Buffer.from('') };
  return { code: 200, type: MIME[extname(file).toLowerCase()] || 'application/octet-stream', body: readFileSync(file) };
}

const BOUNDS = {
  world: { latMin: -62, latMax: 85, lonMin: -180, lonMax: 180 },
  colombia: { latMin: -4.6, latMax: 13.7, lonMin: -82.2, lonMax: -66.6 },
};
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function lookup(mode, title) {
  const t = norm(title);
  const keys = Object.keys(catalog).filter((k) => k.startsWith(mode + ':')).concat(Object.keys(catalog).filter((k) => !k.startsWith(mode + ':')));
  for (const k of keys) for (const it of catalog[k]) {
    if ([it.titleEs, it.titleEn, it.name, it.nameEn].some((n) => norm(n) === t)) return it;
  }
  return null;
}
const flagByIso = (iso) => catalog['world:flags'].find((f) => f.iso === iso);

const TXT = LOCALE === 'es'
  ? { play: /^JUGAR AHORA$/i, next: /^SIGUIENTE/i, more: /Ver más/i, keep: /^SEGUIR JUGANDO$|^Cerrar$/i, daily: /Desafío diario/i, friends: /Jugar con amigos/i, category: /^Categoría/i }
  : { play: /^PLAY NOW$/i, next: /^NEXT/i, more: /(^|\s)More(\s|›|$)|More about/i, keep: /^KEEP PLAYING$|^Close$/i, daily: /Daily challenge/i, friends: /Play with friends/i, category: /^Category/i };

const b = await launch({ profileRoot: here });

async function newPage(vp) {
  const p = await openPage(b, vp);
  // Nada hacia Supabase ni Analytics: la app se comporta como sin conexión con el servidor
  const patterns = [{ urlPattern: '*supabase.co*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' }];
  if (LOCAL) patterns.push({ urlPattern: ORIGIN + '/*' });
  await p.s('Fetch.enable', { patterns });
  await p.s('Network.enable');
  await p.s('Network.setBypassServiceWorker', { bypass: true });
  b.on((msg) => {
    if (msg.method !== 'Fetch.requestPaused' || msg.sessionId !== p.sessionId) return;
    const { requestId, request } = msg.params;
    if (LOCAL && request.url.startsWith(ORIGIN + '/')) {
      const f = localFile(request.url);
      b.send('Fetch.fulfillRequest', { requestId, responseCode: f.code, responseHeaders: [{ name: 'Content-Type', value: f.type }, { name: 'Cache-Control', value: 'no-store' }], body: f.body.toString('base64') }, p.sessionId).catch(() => {});
      return;
    }
    b.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }, p.sessionId).catch(() => {});
  });
  await p.s('Page.addScriptToEvaluateOnNewDocument', { source: `try {
    if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('sin service worker en las capturas'));
    const set = (k, v) => { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); };
    set('geospeed_locale', '${LOCALE}'); set('geospeed_tutorial_seen', '1'); set('geospeed_onboarding_done', '1');
    set('geospeed_map_drag_learned', '1'); set('geospeed_music_muted', '1');
  } catch (e) {}` });
  p.waitFor = async (expr, timeout = 20000, every = 150) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { const v = await p.evaluate(expr); if (v) return v; } catch { /* página cargando */ }
      await sleep(every);
    }
    throw new Error('timeout: ' + expr.slice(0, 80));
  };
  p.clickText = (re) => p.evaluate(`(() => { const re = ${re}; const els = [...document.querySelectorAll('button, a, [role=button]')].filter(e => re.test((e.innerText || e.textContent || '').trim().replace(/\\s+/g, ' '))); const e = els.find(x => x.offsetParent !== null) || els[0]; if (!e) return false; e.click(); return true; })()`);
  p.hasText = (re) => p.evaluate(`(() => { const re = ${re}; return [...document.querySelectorAll('button, a, [role=button]')].some(e => e.offsetParent !== null && re.test((e.innerText || e.textContent || '').trim().replace(/\\s+/g, ' '))); })()`);
  p.save = async (name) => { writeFileSync(join(OUT, name + '.png'), await p.screenshot()); console.log('  ✓', name); };
  return p;
}

async function openHome(p, selection) {
  await p.navigate(ORIGIN + '/');
  await p.waitFor(`document.readyState === 'complete'`);
  if (selection) {
    await p.evaluate(`localStorage.setItem('geospeed_last_selection', ${JSON.stringify(JSON.stringify(selection))}); true`);
    await p.navigate(ORIGIN + '/');
  }
  await p.waitFor(`(() => { const re = ${TXT.play}; return [...document.querySelectorAll('button')].some(b => re.test((b.innerText || '').trim())); })()`, 40000);
  await sleep(1200);
}

/** Pregunta actual: título (o bandera) y caja del lienzo del mapa */
const READ_PROMPT = `(() => {
  const root = document.querySelector('[data-game-container]'); if (!root) return null;
  const flag = root.querySelector('img[src*="/flags/"]');
  let title = null;
  for (const s of root.querySelectorAll('span')) {
    const t = (s.textContent || '').trim();
    if (/^(¿Dónde está|Where is)/.test(t)) { const h = s.querySelector('.text-primary'); if (h && h.textContent.trim()) { title = h.textContent.trim(); break; } }
  }
  const cs = [...root.querySelectorAll('canvas')].map(c => ({ r: c.getBoundingClientRect() })).filter(o => o.r.width > 150).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height);
  if (!cs.length || (!title && !flag)) return null;
  const r = cs[0].r;
  return { title, flag: flag ? flag.getAttribute('src') : null, box: { left: r.left, top: r.top, w: r.width, h: r.height } };
})()`;

function target(mode, prompt) {
  if (prompt.flag && !prompt.title) {
    const iso = (prompt.flag.match(/flags\/([A-Z]{2})/) || [])[1];
    return flagByIso(iso);
  }
  return lookup(mode, prompt.title);
}

async function answer(p, mode, { jitter = 0.08 } = {}) {
  const prompt = await p.waitFor(READ_PROMPT, 30000);
  const it = target(mode, prompt);
  if (!it) throw new Error('sin coordenadas para ' + JSON.stringify(prompt));
  const B = BOUNDS[mode];
  const lonR = B.lonMax - B.lonMin, latR = B.latMax - B.latMin;
  const { left, top, w, h } = prompt.box;
  const scale = Math.min(w / lonR, h / latR);
  const ox = (w - lonR * scale) / 2, oy = (h - latR * scale) / 2;
  const lat = it.lat + (Math.random() - 0.5) * jitter, lon = it.lon + (Math.random() - 0.5) * jitter;
  const x = left + ox + (lon - B.lonMin) * scale, y = top + oy + (B.latMax - lat) * scale;
  await p.tap(x, y);
  return { it, prompt };
}

const waitCard = (p) => p.waitFor(`(() => { const re = ${TXT.next}; return [...document.querySelectorAll('button')].some(b => b.offsetParent !== null && re.test((b.innerText || '').trim())); })()`, 15000);

const LAND = { width: 844, height: 390, scale: 2, mobile: true, touch: true };
const PORT = { width: 390, height: 844, scale: 3, mobile: true, touch: true };
const TAB = { width: 1280, height: 800, scale: 2, mobile: false, touch: false };

const scenes = {
  // 1–2 y 8–9: partida clásica en el mundo (pregunta, respuesta, reseña del lugar, récord)
  async classic() {
    const p = await newPage(LAND);
    await openHome(p, { mode: 'world', difficulty: 'basic', category: 'cities' });
    await p.clickText(TXT.play);
    await p.waitFor(READ_PROMPT, 30000);
    await sleep(1300);
    await p.save('01-pregunta');
    await answer(p, 'world');
    await sleep(1700);
    await p.save('01b-linea');
    await waitCard(p);
    await sleep(1100);
    await p.save('02-respuesta');
    if (await p.clickText(TXT.more)) {
      await sleep(4500);
      await p.save('08-resena');
      await p.clickText(TXT.keep);
      await sleep(800);
    }
    if (process.env.FULL !== '1') return;
    for (let round = 2; round <= 13; round++) {
      await p.clickText(TXT.next);
      await p.waitFor(READ_PROMPT, 20000);
      await sleep(900);
      await answer(p, 'world');
      await waitCard(p);
      await sleep(400);
    }
    await p.clickText(TXT.next);
    await sleep(3800);
    await p.save('09-final');
  },
  // 4: banderas
  async flags() {
    const p = await newPage(LAND);
    await openHome(p, { mode: 'world', difficulty: 'basic', category: 'flags' });
    await p.clickText(TXT.play);
    await p.waitFor(READ_PROMPT, 30000);
    await sleep(1300);
    await p.save('04-bandera');
    await answer(p, 'world', { jitter: 0 });
    await waitCard(p);
    await sleep(1100);
    await p.save('04b-bandera-respuesta');
  },
  // 5: pack Colombia (departamentos)
  async colombia() {
    const p = await newPage(LAND);
    await openHome(p, { mode: 'colombia', difficulty: 'basic', category: 'divisions' });
    await p.clickText(TXT.play);
    await p.waitFor(READ_PROMPT, 30000);
    await sleep(1500);
    await p.save('05-colombia');
    await answer(p, 'colombia', { jitter: 0 });
    await waitCard(p);
    await sleep(1100);
    await p.save('05b-colombia-respuesta');
  },
  // 3: inicio con la hoja de categorías (vertical)
  async home() {
    const p = await newPage(PORT);
    await openHome(p, { mode: 'world', difficulty: 'basic', category: 'cities' });
    await p.save('03a-inicio');
    await p.evaluate(`document.querySelector('button[aria-label^="Categoría:"], button[aria-label^="Category:"]').click(); true`);
    await sleep(1500);
    await p.save('03-categorias');
  },
  // 6: desafío diario (vertical)
  async daily() {
    const p = await newPage(PORT);
    await openHome(p, null);
    await p.clickText(TXT.daily);
    await sleep(2500);
    await p.save('06-diario');
  },
  // 7: jugar con amigos (vertical)
  async friends() {
    const p = await newPage(PORT);
    await openHome(p, null);
    await p.clickText(TXT.friends);
    await sleep(2500);
    await p.save('07-amigos');
  },
  // 8: reseña del lugar de una ciudad con foto icónica (se reintenta con otra partida hasta que salga una)
  async story() {
    const NICE = LOCALE === 'es'
      ? ['París', 'Roma', 'Tokio', 'Río de Janeiro', 'Sídney', 'Nueva York', 'Londres', 'Barcelona', 'Estambul', 'Ciudad del Cabo', 'Praga', 'Venecia', 'Kioto', 'Dubái', 'Singapur', 'San Francisco', 'Ámsterdam', 'Atenas', 'Lisboa']
      : ['Paris', 'Rome', 'Tokyo', 'Rio de Janeiro', 'Sydney', 'New York', 'London', 'Barcelona', 'Istanbul', 'Cape Town', 'Prague', 'Venice', 'Kyoto', 'Dubai', 'Singapore', 'San Francisco', 'Amsterdam', 'Athens', 'Lisbon'];
    for (let attempt = 1; attempt <= 14; attempt++) {
      const p = await newPage(LAND);
      await openHome(p, { mode: 'world', difficulty: 'basic', category: 'cities' });
      await p.clickText(TXT.play);
      const prompt = await p.waitFor(READ_PROMPT, 30000);
      if (!NICE.includes(prompt.title)) { console.log('  …', prompt.title); await p.close(); continue; }
      await sleep(1100);
      await answer(p, 'world');
      await waitCard(p);
      await sleep(900);
      await p.save('02-respuesta-' + norm(prompt.title).replace(/\s+/g, '-'));
      await p.clickText(TXT.more);
      await sleep(5500);
      await p.save('08-resena');
      await p.close();
      return;
    }
    throw new Error('no salió ninguna ciudad de la lista');
  },
  // Inicio en tableta (opcional)
  async tablet() {
    const p = await newPage(TAB);
    await openHome(p, { mode: 'world', difficulty: 'basic', category: 'cities' });
    await p.save('10-inicio-tableta');
  },
};

try {
  for (const [name, fn] of Object.entries(scenes)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    console.log('escena', name);
    try { await fn(); } catch (e) { console.log('  ✗', name, e.message); }
  }
} finally {
  await b.close();
}

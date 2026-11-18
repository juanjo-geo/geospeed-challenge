// Captura fija de una pantalla del juego para el video (misma técnica que las capturas de Play: dist/ con el dominio
// de producción, Supabase y Analytics bloqueados).
// Uso: node video/scripts/shot.mjs <salida.png> "<texto del botón a tocar desde Inicio>" [ancho alto]
import { writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage, sleep } from '../../scripts/store-shots/cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.argv[2]);
const CLICK = process.argv[3] || '';
const VW = Number(process.argv[4] || 852), VH = Number(process.argv[5] || 393);
const ORIGIN = 'https://geospeed-challenge.vercel.app';
const DIST = resolve(here, '../../dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
function localFile(url) {
  const u = new URL(url);
  let file = join(DIST, decodeURIComponent(u.pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) file = extname(u.pathname) ? null : join(DIST, 'index.html');
  if (!file || !existsSync(file)) return { code: 404, type: 'text/plain', body: Buffer.from('') };
  return { code: 200, type: MIME[extname(file).toLowerCase()] || 'application/octet-stream', body: readFileSync(file) };
}
const b = await launch({ profileRoot: resolve(here, '../rec') });
const p = await openPage(b, { width: VW, height: VH, scale: VW < VH ? 3 : 2, mobile: true, touch: true });
await p.s('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }, { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' }, { urlPattern: ORIGIN + '/*' }] });
await p.s('Network.enable');
await p.s('Network.setBypassServiceWorker', { bypass: true });
b.on((msg) => {
  if (msg.method !== 'Fetch.requestPaused' || msg.sessionId !== p.sessionId) return;
  const { requestId, request } = msg.params;
  if (request.url.startsWith(ORIGIN + '/')) {
    const f = localFile(request.url);
    b.send('Fetch.fulfillRequest', { requestId, responseCode: f.code, responseHeaders: [{ name: 'Content-Type', value: f.type }, { name: 'Cache-Control', value: 'no-store' }], body: f.body.toString('base64') }, p.sessionId).catch(() => {});
  } else {
    b.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }, p.sessionId).catch(() => {});
  }
});
await p.s('Page.addScriptToEvaluateOnNewDocument', { source: `try {
  if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('sin service worker'));
  const set = (k, v) => { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); };
  set('geospeed_locale', '${process.env.LOCALE === 'en' ? 'en' : 'es'}'); set('geospeed_tutorial_seen', '1'); set('geospeed_onboarding_done', '1'); set('geospeed_music_muted', '1');
} catch (e) {}` });
const waitFor = async (expr, timeout = 40000) => {
  const s = Date.now();
  while (Date.now() - s < timeout) { try { const v = await p.evaluate(expr); if (v) return v; } catch { /* cargando */ } await sleep(150); }
  throw new Error('timeout: ' + expr.slice(0, 80));
};
await p.navigate(ORIGIN + '/');
await waitFor(`[...document.querySelectorAll('button')].some(b => /^(JUGAR AHORA|PLAY NOW)$/i.test((b.innerText || '').trim()))`);
await sleep(1500);
if (CLICK) {
  const ok = await p.evaluate(`(() => { const t = ${JSON.stringify(CLICK)}.toLowerCase(); const els = [...document.querySelectorAll('button, a, [role=button]')].filter(e => (e.innerText || '').toLowerCase().includes(t)); const e = els.find(x => x.offsetParent !== null) || els[0]; if (!e) return false; e.click(); return true; })()`);
  if (!ok) throw new Error('no encontré el botón: ' + CLICK);
  await sleep(3000);
}
writeFileSync(OUT, await p.screenshot());
console.log('✓', OUT);
await b.close();
process.exit(0);

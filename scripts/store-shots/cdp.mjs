// Cliente mínimo del protocolo de Chrome DevTools por tubería (--remote-debugging-pipe), sin dependencias.
// Lo usan los scripts de capturas para la ficha de Play (punto 13).
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe', profileRoot, args = [] } = {}) {
  const userDir = mkdtempSync(join(profileRoot, 'chr-'));
  const proc = spawn(chrome, [
    '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${userDir}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--lang=es-419', '--force-color-profile=srgb', ...args, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  let stderr = '';
  proc.stdio[2].on('data', (d) => { stderr += d.toString(); if (stderr.length > 20000) stderr = stderr.slice(-20000); });
  const out = proc.stdio[3];
  const inp = proc.stdio[4];
  let buf = Buffer.alloc(0);
  const pending = new Map();
  const listeners = new Set();
  let nextId = 1;
  inp.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    let i;
    while ((i = buf.indexOf(0)) >= 0) {
      const raw = buf.subarray(0, i).toString('utf8');
      buf = buf.subarray(i + 1);
      let msg;
      try { msg = JSON.parse(raw); } catch { continue; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(`${msg.error.message} ${msg.error.data ?? ''}`)); else res(msg.result);
      } else {
        for (const l of listeners) l(msg);
      }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, { res, rej });
    out.write(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }) + '\0');
  });
  const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const close = async () => { try { await send('Browser.close'); } catch { /* ya cerrado */ } setTimeout(() => proc.kill(), 1500); };
  return { send, on, close, proc, stderr: () => stderr };
}

/** Abre una pestaña y devuelve helpers ligados a su sesión. */
export async function openPage(b, { width, height, scale = 1, mobile = false, touch = false, fresh = true } = {}) {
  // Contexto propio = almacenamiento limpio (vidas, historial, selección) en cada escena
  const ctx = fresh ? (await b.send('Target.createBrowserContext', { disposeOnDetach: true })).browserContextId : undefined;
  const { targetId } = await b.send('Target.createTarget', ctx ? { url: 'about:blank', browserContextId: ctx } : { url: 'about:blank' });
  const { sessionId } = await b.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => b.send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile, screenWidth: width, screenHeight: height });
  if (touch) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const evaluate = async (expression) => {
    const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ''}`);
    return r.result.value;
  };
  const screenshot = async (clip) => {
    const { data } = await s('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 1 } } : { format: 'png' });
    return Buffer.from(data, 'base64');
  };
  const navigate = (url) => s('Page.navigate', { url });
  const tap = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await s('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
  };
  const close = () => b.send('Target.closeTarget', { targetId }).catch(() => {});
  return { s, sessionId, targetId, evaluate, screenshot, navigate, tap, close };
}

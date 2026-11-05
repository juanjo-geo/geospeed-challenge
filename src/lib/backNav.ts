import { useEffect, useLayoutEffect, useRef } from 'react';
import { isNativeApp } from './assetUrl';

/**
 * "Atrás" del teléfono (botón o gesto de Android) y del navegador: hace lo mismo que el botón visible de la pantalla
 * o la ventana que está arriba (volver, cerrar, cancelar, salir de la partida con confirmación).
 *
 * Cada pantalla, hoja o ventana registra su acción con `useBackHandler` (ScreenHeader ya lo hace con su `onBack`).
 * Gana la capa más alta (ventana > superposición > pantalla > respaldo de Index) y, dentro de la misma capa, la última
 * que se activó. Sin ninguna acción (Inicio, carga) la app nativa se minimiza y en la web el navegador sale de la página.
 *
 * Regla: toda pantalla o ventana nueva con botón de volver o cerrar usa ScreenHeader o `useBackHandler`. Si un padre y
 * su hijo registran en la misma capa al montarse juntos, gana el padre (sus efectos corren después): el padre solo debe
 * registrar cuando el hijo no lo hace, o el hijo usa una capa más alta.
 */
export const BACK_LAYER = { fallback: 0, screen: 1, overlay: 2, modal: 3 } as const;

interface BackEntry { layer: number; seq: number; run: () => void }
const entries: BackEntry[] = [];
let seq = 0;

/** Registra una acción de atrás; devuelve la función que la quita. */
export function pushBackHandler(run: () => void, layer: number = BACK_LAYER.screen): () => void {
  const entry: BackEntry = { layer, seq: ++seq, run };
  entries.push(entry);
  scheduleSync();
  return () => {
    const i = entries.indexOf(entry);
    if (i >= 0) entries.splice(i, 1);
    scheduleSync();
  };
}

function topEntry(): BackEntry | null {
  let best: BackEntry | null = null;
  for (const e of entries) {
    if (!best || e.layer > best.layer || (e.layer === best.layer && e.seq > best.seq)) best = e;
  }
  return best;
}

/** Hay a dónde volver dentro del juego. */
export const hasBackAction = (): boolean => entries.length > 0;

/** Ejecuta la acción de atrás de arriba. Devuelve false si no hay ninguna. */
export function runBack(): boolean {
  const e = topEntry();
  if (!e) return false;
  try { e.run(); } catch (err) { console.error('[atrás]', err); }
  return true;
}

/**
 * Registra `handler` como la acción de atrás mientras el componente esté montado y `active` (por defecto, siempre que
 * haya handler). El handler puede cambiar en cada render: se llama siempre al último.
 */
export function useBackHandler(handler: (() => void) | null | undefined | false, opts: { layer?: number; active?: boolean } = {}) {
  const ref = useRef(handler);
  useLayoutEffect(() => { ref.current = handler; });
  const active = !!handler && (opts.active ?? true);
  const layer = opts.layer ?? BACK_LAYER.screen;
  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => { const h = ref.current; if (h) h(); }, layer);
  }, [active, layer]);
}

// ─────────────────────────── App nativa (Android) ───────────────────────────

let nativeStarted = false;

async function initNativeBack() {
  if (nativeStarted) return;
  nativeStarted = true;
  try {
    const { App } = await import('@capacitor/app');
    // Con un oyente, Capacitor deja de cerrar la app al tocar atrás y nos pasa cada pulsación (botón o gesto)
    await App.addListener('backButton', ({ canGoBack }) => {
      if (runBack()) return;
      // Páginas fuera del juego sin acción propia (legales, soporte): volver en el historial
      if (window.location.pathname !== '/') {
        if (canGoBack) window.history.back(); else window.location.replace('/');
        return;
      }
      // Inicio: como cualquier app de Android, atrás la manda al fondo (no la cierra)
      void App.minimizeApp().catch(() => {});
    });
  } catch (e) {
    nativeStarted = false;
    console.warn('[atrás] el complemento App no está disponible', e);
  }
}

// ─────────────────────────── Navegador ───────────────────────────
// Mientras haya a dónde volver, la entrada actual del historial es un "centinela" (misma URL, marca en el estado).
// Al tocar atrás el navegador lo quita (popstate): se ejecuta la acción y, si sigue habiendo a dónde volver, se pone
// otro. Al volver a Inicio con los botones del juego, el centinela se retira para que el siguiente atrás salga.

const SENTINEL = 'gsBack';
let webStarted = false;
let armed = false; // la entrada actual es nuestro centinela
let ignorePops = 0; // "atrás" que hicimos nosotros para retirar un centinela
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function onSentinel(): boolean {
  const s = window.history.state as Record<string, unknown> | null;
  return !!s && s[SENTINEL] === true;
}

function scheduleSync() {
  if (!webStarted || syncTimer) return;
  // Se agrupan los cambios de un mismo render (una pantalla sale y otra entra) en una sola decisión
  syncTimer = setTimeout(() => { syncTimer = null; syncTrap(); }, 0);
}

function syncTrap() {
  if (ignorePops > 0) return; // nuestro "atrás" sigue en camino: se decide al llegar
  // Solo el juego (ruta "/") navega por fases sin cambiar la URL. Las demás páginas (/auth, /privacy…) tienen su
  // propia dirección y el historial del navegador ya las maneja: un centinela allí haría ir y volver sin salir nunca.
  const want = entries.length > 0 && window.location.pathname === '/';
  armed = onSentinel();
  if (want && !armed) {
    // Se copia el estado de react-router (idx, key) para que su historial siga cuadrando
    window.history.pushState({ ...((window.history.state as object | null) ?? {}), [SENTINEL]: true }, '');
    armed = true;
  } else if (!want && armed) {
    ignorePops++;
    armed = false;
    window.history.back();
  }
}

function samePath(url: string | URL | null | undefined): boolean {
  if (url == null) return true;
  try { return new URL(String(url), window.location.href).pathname === window.location.pathname; } catch { return false; }
}

function initWebBack() {
  if (webStarted) return;
  webStarted = true;
  // Un centinela que quedó de antes de recargar no se retira con "atrás" (sería otra carga de página): se desmarca
  if (onSentinel()) {
    const { [SENTINEL]: _drop, ...rest } = window.history.state as Record<string, unknown>;
    window.history.replaceState(rest, '');
  }
  // Volver al Inicio hace navigate('/', { replace: true }): si la entrada actual es el centinela, conserva la marca
  // para poder retirarlo después (si no, quedaría una entrada repetida y el siguiente "atrás" no haría nada)
  const replace = window.history.replaceState.bind(window.history);
  window.history.replaceState = (state: unknown, unused: string, url?: string | URL | null) => {
    const keep = onSentinel() && samePath(url) && (state == null || typeof state === 'object');
    replace(keep ? { ...((state as object | null) ?? {}), [SENTINEL]: true } : state, unused, url);
    armed = onSentinel();
  };
  window.addEventListener('popstate', () => {
    const wasArmed = armed;
    armed = onSentinel();
    if (ignorePops > 0) {
      ignorePops--;
      scheduleSync();
      return;
    }
    // El usuario tocó atrás estando en el centinela: hacer lo del botón de volver de la pantalla de arriba
    if (wasArmed && !armed) runBack();
    scheduleSync();
  });
  scheduleSync();
}

/** Arranca el manejo de "atrás" (una vez, al iniciar la app). */
export function initBackNavigation(): void {
  if (typeof window === 'undefined') return;
  if (isNativeApp()) void initNativeBack();
  else initWebBack();
}

/** Solo pruebas: deja el módulo como recién cargado. */
export function __resetBackNavForTests() {
  entries.length = 0;
  seq = 0;
  armed = false;
  ignorePops = 0;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
}

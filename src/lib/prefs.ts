/**
 * GeoSpeed — Preferencias del jugador (Ajustes)
 *
 * Una sola clave en localStorage: `geospeed_prefs`.
 *   { sfx: boolean; haptics: boolean; reduceMotion: boolean }
 *
 * La música tiene su propia clave histórica (`geospeed_music_muted`, en
 * useBackgroundMusic) y se gestiona desde allí; la pantalla de Ajustes la
 * expone junto a estas tres.
 *
 * Este módulo no importa React: lo consultan sounds.ts, haptics.ts,
 * confetti.ts, juiceAnimations.ts y los canvas, que corren fuera del árbol.
 */

export interface Prefs {
  /** Efectos de sonido (clics, aciertos, cuenta regresiva). No afecta la música. */
  sfx: boolean;
  /** Vibración háptica en móviles. */
  haptics: boolean;
  /** Reducir movimiento: desactiva confeti, zoom automático, demo animada y acorta transiciones. */
  reduceMotion: boolean;
}

const STORAGE_KEY = 'geospeed_prefs';
const DEFAULTS: Prefs = { sfx: true, haptics: true, reduceMotion: false };
const REDUCE_MOTION_CLASS = 'reduce-motion';

let cache: Prefs | null = null;
const listeners = new Set<(p: Prefs) => void>();

function read(): Prefs {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function write(next: Prefs) {
  cache = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* modo privado o cuota llena: seguimos en memoria */ }
  applyDomClass(next);
  listeners.forEach(l => l(next));
}

function applyDomClass(p: Prefs) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, p.reduceMotion);
}

/** Preferencias actuales (lectura barata, cacheada). */
export function getPrefs(): Prefs {
  return read();
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  write({ ...read(), [key]: value });
}

export function togglePref(key: keyof Prefs) {
  setPref(key, !read()[key]);
}

/** Suscribirse a cambios (devuelve la función para cancelar). */
export function subscribePrefs(listener: (p: Prefs) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Aplica la clase `reduce-motion` al <html> según lo guardado. Llamar una vez al arrancar. */
export function initPrefs() {
  applyDomClass(read());
}

// ── Atajos que usan los módulos de efectos ──────────────────────────────

export function isSfxEnabled(): boolean {
  return read().sfx;
}

export function isHapticsEnabled(): boolean {
  return read().haptics;
}

/**
 * true si el jugador pidió reducir movimiento en Ajustes O si el sistema
 * operativo lo pide (prefers-reduced-motion). Es la única función que deben
 * consultar confeti, zoom automático, demo y animaciones DOM.
 */
export function prefersReducedMotion(): boolean {
  if (read().reduceMotion) return true;
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

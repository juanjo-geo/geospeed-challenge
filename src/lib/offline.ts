/**
 * Juego sin conexión (Fase 11, docs/GeoSpeed_Plan_Competencia.md §6).
 *  · Sin señal se juega lo individual (Clásico, 60s de Caos, Mundial, entrenamiento, repaso, quizzes propios) — solo
 *    con Pro mientras el feature flag `offline_pro_only` esté encendido (decisión de JuanJo, 2026-10-25); el diario,
 *    Sprint, retos y ranking piden conexión. Las partidas quedan en la cola del teléfono (geospeed_pending_results,
 *    idempotente por client_id) y llegan con offline = true: cuentan para el progreso, no para los rankings.
 *  · Paquete base (código, datos, mascota, banderas, música; ~6 MB): lo guarda el service worker al instalarse
 *    (dist/offline-manifest.json, plugin de vite.config.ts).
 *  · Packs de fotos ("Descargas"): países, ciudades del mundo, Colombia, packs LatAm y monumentos, cada uno en su
 *    caché "geospeed-pack-<id>" (el service worker los sirve sin señal y no los borra al actualizarse).
 *    En la app nativa las fotos vienen del sitio (src/lib/assetUrl.ts) y aún no se descargan.
 */
import { useEffect, useState } from 'react';
import { getFlag } from '@/lib/featureFlags';
import { isPro } from '@/lib/premiumSystem';
import { isNativeApp } from '@/lib/assetUrl';

export const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false;

/** Sin conexión, ¿puede jugar? Pro siempre; los demás solo si el flag `offline_pro_only` se apaga */
export const canPlayOffline = (): boolean => isPro() || !getFlag('offline_pro_only');

/** Estado de la conexión que se actualiza solo (eventos online/offline del navegador) */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => !isOffline());
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

// ── Packs de fotos ──
export type PackId = 'countries' | 'cities-world' | 'cities-colombia' | 'cities-latam' | 'landmarks';
export interface OfflinePack { id: PackId; files: string[]; bytes: number }
export interface OfflineManifest { base: string[]; baseBytes: number; packs: OfflinePack[] }
export const PACK_EMOJI: Record<PackId, string> = { countries: '🌍', 'cities-world': '🏙️', 'cities-colombia': '🇨🇴', 'cities-latam': '🧭', landmarks: '🗼' };
const packCache = (id: string) => `geospeed-pack-${id}`;

/** Los packs se guardan con la Cache API y los sirve el service worker: solo en la web publicada (no en la app nativa) */
export const packsSupported = (): boolean =>
  typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator && !isNativeApp();

export async function fetchOfflineManifest(): Promise<OfflineManifest | null> {
  try {
    const res = await fetch('/offline-manifest.json', { cache: 'no-cache' });
    if (res.ok) return (await res.json()) as OfflineManifest;
  } catch { /* sin red: puede estar en la caché */ }
  try {
    const cached = await caches.match('/offline-manifest.json');
    return cached ? ((await cached.json()) as OfflineManifest) : null;
  } catch {
    return null;
  }
}

/** Cuántos archivos del pack ya están guardados */
export async function packProgress(p: OfflinePack): Promise<number> {
  if (!packsSupported()) return 0;
  try {
    if (!(await caches.has(packCache(p.id)))) return 0; // abrirla la crearía vacía
    const keys = await (await caches.open(packCache(p.id))).keys();
    const have = new Set(keys.map((r) => new URL(r.url).pathname));
    return p.files.filter((f) => have.has(f)).length;
  } catch {
    return 0;
  }
}

/** ¿El paquete base ya quedó guardado? (el service worker lo hace al instalarse) */
export async function baseReady(m: OfflineManifest): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const sample = m.base.filter((u) => u.startsWith('/assets/')).slice(0, 25);
    const found = await Promise.all(sample.map((u) => caches.match(u, { ignoreVary: true })));
    return found.every(Boolean);
  } catch {
    return false;
  }
}

/** Descarga un pack (6 a la vez); se puede cancelar. Lo que ya estaba no se vuelve a pedir. */
export async function downloadPack(p: OfflinePack, onProgress: (done: number) => void, signal?: AbortSignal): Promise<boolean> {
  const cache = await caches.open(packCache(p.id));
  const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  let done = p.files.filter((f) => have.has(f)).length;
  onProgress(done);
  const todo = p.files.filter((f) => !have.has(f));
  let i = 0;
  let failed = false;
  const worker = async () => {
    while (i < todo.length && !signal?.aborted) {
      const url = todo[i++];
      try {
        const res = await fetch(url, { signal });
        if (res.ok) { await cache.put(url, res); done++; onProgress(done); } else failed = true;
      } catch {
        if (signal?.aborted) return;
        failed = true;
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return !failed && !signal?.aborted && done >= p.files.length;
}

export async function deletePack(id: PackId): Promise<void> {
  try { await caches.delete(packCache(id)); } catch { /* nada que borrar */ }
}

/** Espacio que usa la app en este dispositivo (estimación del navegador) */
export async function storageUsed(): Promise<{ used: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { used: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}

export const formatMB = (bytes: number, locale: string) =>
  `${(bytes / 1048576).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO', { maximumFractionDigits: bytes < 10 * 1048576 ? 1 : 0 })} MB`;

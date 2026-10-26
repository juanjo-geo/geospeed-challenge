/**
 * Fotos de los monumentos (Fase 6c): public/landmarks/<slug>.webp (≤ 800 px) y <slug>-sm.webp (≤ 480 px),
 * generadas por scripts/build-landmarks.mjs + scripts/convert-landmarks.py desde Wikimedia Commons (licencias
 * libres). public/landmarks/credits.json lleva autor, licencia y fuente de cada una (se listan en Soporte).
 */
import type { PhotoSize } from './countryPhotos';
import { photoUrl } from '@/lib/assetUrl';

const slugOf = (id: string | undefined | null): string | null => (id && id.startsWith('mon:') ? id.slice(4) : null);

/** URL de la foto de un monumento por su id de catálogo (`mon:<slug>`); null si no tiene foto */
export function landmarkPhotoUrl(item: { id?: string; photo?: boolean } | null | undefined, size: PhotoSize = 'lg'): string | null {
  const slug = slugOf(item?.id);
  if (!slug || !item?.photo) return null;
  return photoUrl(`/landmarks/${slug}${size === 'sm' ? '-sm' : ''}.webp`);
}

export function preloadLandmarkPhoto(item: { id?: string; photo?: boolean } | null | undefined, size: PhotoSize = 'sm'): void {
  const url = landmarkPhotoUrl(item, size);
  if (!url || typeof Image === 'undefined') return;
  const img = new Image();
  img.src = url;
}

export interface LandmarkCredit { id: string; name: string; author?: string; source?: string; license?: string; licenseUrl?: string; url?: string }
let creditsPromise: Promise<LandmarkCredit[]> | null = null;
export function fetchLandmarkCredits(): Promise<LandmarkCredit[]> {
  if (!creditsPromise) {
    creditsPromise = fetch(photoUrl('/landmarks/credits.json')).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  }
  return creditsPromise;
}

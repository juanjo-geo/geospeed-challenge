import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/theme';

/**
 * Foto de perfil propia. Se queda en este dispositivo (no se sube al servidor): solo la ve su dueño, en sus propias
 * pantallas; los demás jugadores siguen viendo el avatar guardado en el servidor. Para que otros la vieran harían falta
 * moderación y reporte dentro de la app, y actualizar la política y "Seguridad de los datos" en Play.
 */
const PHOTO_KEY = 'geospeed_avatar_photo';
const PHOTO_EVENT = 'geospeed:profile-photo';
const PHOTO_SIZE = 256;

export function getProfilePhoto(): string | null {
  try { return localStorage.getItem(PHOTO_KEY); } catch { return null; }
}

/** Devuelve false si el dispositivo no pudo guardarla */
export function setProfilePhoto(dataUrl: string): boolean {
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { return false; }
  window.dispatchEvent(new Event(PHOTO_EVENT));
  return true;
}

export function clearProfilePhoto() {
  try { localStorage.removeItem(PHOTO_KEY); } catch { /* almacenamiento bloqueado */ }
  window.dispatchEvent(new Event(PHOTO_EVENT));
}

export function useProfilePhoto(): string | null {
  const [photo, setPhoto] = useState(getProfilePhoto);
  useEffect(() => {
    const update = () => setPhoto(getProfilePhoto());
    window.addEventListener(PHOTO_EVENT, update);
    return () => window.removeEventListener(PHOTO_EVENT, update);
  }, []);
  return photo;
}

// ── Recorte: la imagen se mueve y se acerca dentro de un círculo de `box` px ──
export interface CropPos { x: number; y: number }

/** Escala con la que la imagen cubre justo el círculo */
export const coverScale = (w: number, h: number, box: number) => box / Math.min(w, h);

/** `pos` es el desplazamiento del centro de la imagen respecto al centro del círculo: la imagen siempre lo cubre */
export function clampCrop(pos: CropPos, w: number, h: number, box: number, zoom: number): CropPos {
  const s = coverScale(w, h, box) * zoom;
  const maxX = Math.max(0, (w * s - box) / 2);
  const maxY = Math.max(0, (h * s - box) / 2);
  return { x: Math.min(maxX, Math.max(-maxX, pos.x)), y: Math.min(maxY, Math.max(-maxY, pos.y)) };
}

/** Cuadrado de la imagen original que queda dentro del círculo */
export function cropRect(pos: CropPos, w: number, h: number, box: number, zoom: number) {
  const s = coverScale(w, h, box) * zoom;
  return { sx: w / 2 - (box / 2 + pos.x) / s, sy: h / 2 - (box / 2 + pos.y) / s, side: box / s };
}

/** Imagen final, liviana para guardarla en el dispositivo (Safari no codifica WebP: ahí queda JPEG) */
export function renderCrop(img: CanvasImageSource, rect: { sx: number; sy: number; side: number }): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = BRAND.navyDeep; // fondo para las imágenes con transparencia
  ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, rect.sx, rect.sy, rect.side, rect.side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  const webp = canvas.toDataURL('image/webp', 0.82);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Fotos fuera del paquete base (Fase 11): la app nativa no las lleva dentro (países, ciudades y monumentos suman
 * ~80 MB y el paquete base debe quedar en máximo 30 MB), así que en Android/iOS se piden al sitio publicado. En la web
 * se sirven desde el mismo origen y el service worker las guarda cuando se descarga su pack ("Descargas").
 */
const REMOTE_ORIGIN = 'https://geospeed-challenge.vercel.app';

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap) return false;
  return typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : true;
}

/** Ruta de una foto (/countries/…, /cities/…, /landmarks/…): en la app nativa, la del sitio publicado */
export const photoUrl = (path: string): string => (isNativeApp() ? `${REMOTE_ORIGIN}${path}` : path);

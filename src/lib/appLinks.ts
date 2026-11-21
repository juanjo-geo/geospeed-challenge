/**
 * Android App Links (auditoría beta 2026-11-20 + testers: los enlaces de invitación abrían la página web y no la app).
 *
 * Android abre la app en vez del navegador cuando el enlace es de geospeed-challenge.vercel.app y su ruta está
 * declarada en AndroidManifest.xml (intent-filter con autoVerify) y la web publica /.well-known/assetlinks.json con
 * la huella de la llave de Google Play. Al llegar el enlace, la app navega a esa ruta y Index abre la pantalla
 * (reto, sala, quiz, diario, Conquista) igual que en la web.
 */
import { PUBLIC_SITE } from './assetUrl';

/** Rutas que abren la app (las mismas del intent-filter de AndroidManifest.xml) */
export const APP_LINK_PREFIXES = ['/reto/', '/sala/', '/q/', '/d/', '/conquista', '/challenge/', '/daily', '/duel/'];

/** Ruta interna (camino + consulta) de un enlace público del juego, o null si no es uno que la app deba abrir */
export function appLinkPath(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.host !== new URL(PUBLIC_SITE).host) return null;
  // La pantalla para proyectar es para un televisor o computador: se queda en la web
  if (/^\/sala\/[^/]+\/tv\/?$/.test(u.pathname)) return null;
  if (!APP_LINK_PREFIXES.some((p) => u.pathname === p.replace(/\/$/, '') || u.pathname.startsWith(p))) return null;
  const params = new URLSearchParams(u.search);
  params.delete('app'); // ?app=1 solo sirve a la vista previa de WhatsApp en la web
  const q = params.toString();
  return u.pathname + (q ? `?${q}` : '');
}

/** En la app nativa: abre el enlace con que se lanzó la app y los que lleguen con la app abierta */
export async function listenAppLinks(open: (path: string) => void): Promise<() => void> {
  try {
    const { App } = await import('@capacitor/app');
    const launch = await App.getLaunchUrl().catch(() => undefined);
    const first = launch?.url ? appLinkPath(launch.url) : null;
    if (first) open(first);
    const handle = await App.addListener('appUrlOpen', ({ url }) => {
      const path = appLinkPath(url);
      if (path) open(path);
    });
    return () => { void handle.remove(); };
  } catch (e) {
    console.warn('[enlaces] el complemento App no está disponible', e);
    return () => {};
  }
}

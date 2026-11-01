/**
 * Cloudflare Turnstile (punto 10): token anti-bots para las llamadas de autenticación que Supabase protege con CAPTCHA
 * — sesión de invitado (signInAnonymously), iniciar sesión, crear cuenta y recuperar contraseña. Era la condición de
 * "costo cero" de la decisión D1 (sesiones anónimas): sin esto, un bot podría crear usuarios anónimos sin límite.
 *
 *  - Sin VITE_TURNSTILE_SITE_KEY no hace nada: getCaptchaToken() devuelve undefined y todo sigue como antes. Por eso
 *    el orden es: publicar el cliente con la clave, comprobar web y app Android, y recién entonces encender la
 *    protección CAPTCHA en Supabase (si se enciende antes, nadie puede entrar). Pasos en docs/GeoSpeed_Turnstile.md.
 *  - El script de Cloudflare se descarga solo la primera vez que hace falta un token (o al abrir /auth).
 *  - El widget es invisible (appearance 'interaction-only'): si Cloudflare necesita que la persona marque la casilla,
 *    aparece una ventana pequeña encima de todo; al terminar se cierra sola.
 *  - Cada token sirve una sola vez: cada llamada crea un widget nuevo y lo quita al terminar.
 */
import { getTranslations, translate, type Locale } from '@/i18n';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_TIMEOUT_MS = 15_000;
/** Con una casilla a la vista la persona puede tardar; sin interacción el token llega en 1–3 s */
const TOKEN_TIMEOUT_MS = 90_000;

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string | undefined;
  remove(widgetId: string): void;
}
type TurnstileWindow = Window & { turnstile?: TurnstileApi };

function siteKey(): string {
  return String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();
}

/** ¿Está configurado Turnstile en este build? (si no, las llamadas de autenticación van sin token, como antes) */
export function captchaEnabled(): boolean {
  return siteKey().length > 0;
}

let scriptPromise: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  const w = window as TurnstileWindow;
  if (w.turnstile) return Promise.resolve(w.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const fail = () => { scriptPromise = null; reject(new Error('turnstile_unavailable')); };
      const s = document.createElement('script');
      s.src = SCRIPT_URL;
      s.async = true;
      s.defer = true;
      s.onload = () => (w.turnstile ? resolve(w.turnstile) : fail());
      s.onerror = fail;
      document.head.appendChild(s);
      setTimeout(() => { if (!w.turnstile) fail(); }, SCRIPT_TIMEOUT_MS);
    });
  }
  return scriptPromise;
}

/** Descarga el script por adelantado (p. ej. al abrir la pantalla de cuenta) para que el token llegue antes */
export function prefetchCaptcha(): void {
  if (captchaEnabled()) loadTurnstile().catch(() => {});
}

const locale = (): Locale => (document.documentElement.lang === 'en' ? 'en' : 'es');

// Capa propia (no React): el token se pide desde libs como identity.ts, fuera de cualquier pantalla
let layer: { root: HTMLDivElement; slot: HTMLDivElement } | null = null;
function ensureLayer() {
  if (layer && document.body.contains(layer.root)) return layer;
  const dict = getTranslations(locale());
  const root = document.createElement('div');
  root.setAttribute('data-captcha', '');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', translate(dict, 'captcha_title'));
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '400', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', background: 'rgba(0, 0, 0, 0.6)', visibility: 'hidden', pointerEvents: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    maxWidth: '360px', width: '100%', borderRadius: '16px', padding: '16px', textAlign: 'center',
    background: 'hsl(var(--brand-navy-deep))', border: '2px solid hsl(var(--accent) / 0.5)', color: 'hsl(var(--foreground))',
  } satisfies Partial<CSSStyleDeclaration>);
  const title = document.createElement('p');
  title.textContent = translate(dict, 'captcha_title');
  Object.assign(title.style, { fontWeight: '800', fontSize: '1.05rem', margin: '0 0 4px' });
  const desc = document.createElement('p');
  desc.textContent = translate(dict, 'captcha_desc');
  Object.assign(desc.style, { fontSize: '0.9rem', margin: '0 0 12px', opacity: '0.85' });
  const slot = document.createElement('div');
  Object.assign(slot.style, { display: 'flex', justifyContent: 'center', minHeight: '65px' });
  panel.append(title, desc, slot);
  root.append(panel);
  document.body.appendChild(root);
  layer = { root, slot };
  return layer;
}
function showLayer(on: boolean) {
  if (!layer) return;
  layer.root.style.visibility = on ? 'visible' : 'hidden';
  layer.root.style.pointerEvents = on ? 'auto' : 'none';
}

/**
 * Un token de Turnstile nuevo (uno por llamada a Supabase). undefined si Turnstile no está configurado o si no se pudo
 * obtener (sin red, bloqueado, la persona cerró la casilla…): quien llama decide qué hacer.
 * `action` aparece en las estadísticas de Cloudflare: guest, login, signup, reset.
 */
export async function getCaptchaToken(action: 'guest' | 'login' | 'signup' | 'reset'): Promise<string | undefined> {
  const key = siteKey();
  if (!key) return undefined;
  let api: TurnstileApi;
  try { api = await loadTurnstile(); } catch { return undefined; }
  const { slot } = ensureLayer();
  return new Promise<string | undefined>((resolve) => {
    const box = document.createElement('div');
    slot.appendChild(box);
    let widgetId: string | undefined;
    let done = false;
    const finish = (token?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      showLayer(false);
      try { if (widgetId) api.remove(widgetId); } catch { /* ya no estaba */ }
      box.remove();
      resolve(token || undefined);
    };
    const timer = setTimeout(() => finish(undefined), TOKEN_TIMEOUT_MS);
    try {
      widgetId = api.render(box, {
        sitekey: key,
        action,
        appearance: 'interaction-only',
        theme: 'dark',
        language: locale(),
        callback: (token: string) => finish(token),
        'error-callback': () => finish(undefined),
        'expired-callback': () => finish(undefined),
        'timeout-callback': () => finish(undefined),
        'unsupported-callback': () => finish(undefined),
        'before-interactive-callback': () => showLayer(true),
        'after-interactive-callback': () => showLayer(false),
      });
    } catch {
      finish(undefined);
    }
  });
}

/** ¿El error de Supabase es del CAPTCHA? (para mostrar el mensaje adecuado en vez del genérico) */
export function isCaptchaError(message: string | undefined): boolean {
  return /captcha/i.test(message ?? '');
}

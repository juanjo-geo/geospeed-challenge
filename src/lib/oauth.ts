/**
 * "Continuar con Google" (pedido de JuanJo, 2026-11-02). Guía del panel: docs/GeoSpeed_Google_Login.md.
 *
 *  - Solo en la web: dentro de la app de Android, Google no deja iniciar sesión en el WebView (hace falta un complemento
 *    nativo, pendiente para el AAB).
 *  - El botón aparece solo si Google está activo en Supabase (Authentication → Sign In / Providers → Google): así el
 *    código se publica antes de configurarlo y nunca lleva a una página de error de Supabase.
 *  - Iniciar sesión: signInWithOAuth → Google → vuelve a /auth?oauth=google con la sesión. Un invitado se lleva su
 *    progreso con el ticket de traslado (prepareTransfer / redeemTransfer, como al entrar con correo).
 *  - Crear cuenta: un invitado enlaza Google a su usuario (linkIdentity), que pasa a ser cuenta con el mismo id y lo
 *    conserva todo. Si esa cuenta de Google ya tenía cuenta en GeoSpeed, Supabase lo rechaza y se ofrece entrar con ella.
 *  - Quien entra con Google sin nombre de jugador recibe su nombre de pila (useAuth, googleFirstName).
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp } from '@/lib/assetUrl';
import { isAnonymousSession, prepareTransfer } from '@/lib/identity';

let available: Promise<boolean> | null = null;

/** ¿Se muestra el botón? (Google activo en Supabase y no estamos dentro de la app nativa). Se pregunta una vez. */
export function googleSignInAvailable(): Promise<boolean> {
  if (isNativeApp()) return Promise.resolve(false);
  // Solo en desarrollo: ?google en la dirección muestra el botón para revisar la pantalla (sin Google activo, falla)
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('google')) return Promise.resolve(true);
  available ??= fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { external?: { google?: boolean } } | null) => !!s?.external?.google)
    .catch(() => false);
  return available;
}

/** A dónde vuelve Google: /auth (misma dirección que el sitio, así Supabase la acepta) con el destino final */
const returnUrl = (next: string) =>
  `${window.location.origin}/auth?oauth=google${next !== '/' ? `&next=${encodeURIComponent(next)}` : ''}`;

/**
 * Va a Google. Si todo sale bien, el navegador sale de la app; solo vuelve con `error` si falló antes de salir.
 *  - `link` (Crear cuenta): un invitado enlaza Google a su usuario y lo conserva todo.
 *  - Sin `link` (Iniciar sesión, o la cuenta de Google ya existía): entra a la cuenta de Google; si venía de invitado,
 *    su progreso viaja con el ticket de traslado (se canjea al volver, useAuth → redeemTransfer).
 */
export async function continueWithGoogle(next = '/', opts: { link?: boolean; chooseAccount?: boolean } = {}): Promise<{ error?: string }> {
  const guest = await isAnonymousSession();
  if (guest && opts.link) {
    const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: returnUrl(next) } });
    if (!error) return {};
    // No se pudo enlazar (p. ej. enlace manual apagado en Supabase): cuenta de Google + traslado del progreso
  }
  if (guest) await prepareTransfer();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: returnUrl(next), queryParams: opts.chooseAccount ? { prompt: 'select_account' } : undefined },
  });
  return { error: error?.message };
}

export type OAuthReturnError = 'linked_elsewhere' | 'cancelled' | 'failed';

/** El error que dejó Google/Supabase en la dirección al volver (en ?… o en #…), o null si no hay */
export function oauthReturnError(search = window.location.search, hash = window.location.hash): OAuthReturnError | null {
  const all = new URLSearchParams(search);
  new URLSearchParams(hash.replace(/^#/, '')).forEach((v, k) => all.set(k, v));
  const error = all.get('error');
  const code = all.get('error_code') ?? '';
  const desc = (all.get('error_description') ?? '').toLowerCase();
  if (!error && !code && !desc) return null;
  if (code === 'identity_already_exists' || /already (linked|exists)/.test(desc)) return 'linked_elsewhere';
  if (error === 'access_denied') return 'cancelled';
  return 'failed';
}

/**
 * Nombre de jugador para quien entró con Google y todavía no tiene uno: su nombre de pila (no el apellido; lo puede
 * cambiar en el perfil). '' si no entró con Google o Google no dio nombre.
 */
export function googleFirstName(user: Pick<User, 'identities' | 'app_metadata' | 'user_metadata'> | null | undefined): string {
  if (!user) return '';
  const viaGoogle = user.identities?.some((i) => i.provider === 'google')
    || (user.app_metadata?.providers as string[] | undefined)?.includes('google')
    || user.app_metadata?.provider === 'google';
  if (!viaGoogle) return '';
  const meta = user.user_metadata ?? {};
  const full = String(meta.given_name ?? meta.full_name ?? meta.name ?? '').trim();
  return full.split(/\s+/)[0]?.slice(0, 20) ?? '';
}

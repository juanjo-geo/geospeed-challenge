/**
 * F1 (cierre) · Identidad del jugador (decisión D1: Anonymous Sign-in, sesión perezosa, costo cero).
 *
 *  - ensureGuestSession(): crea una sesión anónima SOLO cuando hace falta guardar algo en el
 *    servidor (fin de la primera partida, crear/unirse a un reto). Visitantes que solo miran el
 *    inicio no cuentan como usuarios activos. Si el anónimo está desactivado en Supabase, se
 *    recuerda 6 h para no reintentar en cada partida (las partidas quedan en la cola offline).
 *  - Invitado → cuenta nueva: linkGuestEmail() convierte al anónimo en permanente (mismo user_id,
 *    conserva todo). Tras confirmar el correo vuelve a /auth?mode=set-password para la contraseña.
 *  - Invitado → cuenta existente: prepareTransfer() antes de iniciar sesión y redeemTransfer()
 *    después (ticket de un solo uso en el servidor, migración 20261018150000_account_transfer.sql).
 */
import { supabase } from '@/integrations/supabase/client';

const ANON_OFF_KEY = 'geospeed_anon_unavailable_until';
const TRANSFER_KEY = 'geospeed_transfer_ticket';
const NAME_KEY = 'geospeed_pending_display_name';

export type GuestSessionResult = 'existing' | 'created' | 'unavailable';

export async function ensureGuestSession(): Promise<GuestSessionResult> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return 'existing';
    const until = Number(localStorage.getItem(ANON_OFF_KEY) || 0);
    if (until > Date.now()) return 'unavailable';
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      // Desactivado en el panel (o sin red): no insistir durante 6 h
      localStorage.setItem(ANON_OFF_KEY, String(Date.now() + 6 * 3600 * 1000));
      return 'unavailable';
    }
    localStorage.removeItem(ANON_OFF_KEY);
    // Nombre elegido antes de tener sesión → al perfil
    const pending = localStorage.getItem(NAME_KEY);
    if (pending) { await updateMyProfile({ displayName: pending }); localStorage.removeItem(NAME_KEY); }
    return 'created';
  } catch {
    return 'unavailable';
  }
}

export async function isAnonymousSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.user?.is_anonymous;
}

/** Nombre y avatar visibles en ranking y retos. Sin sesión, el nombre se guarda para después. */
export async function updateMyProfile(p: { displayName?: string; avatar?: string }): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    if (p.displayName) localStorage.setItem(NAME_KEY, p.displayName.trim().slice(0, 20));
    return false;
  }
  const { error } = await supabase.rpc('update_my_profile', {
    p_display_name: p.displayName?.trim().slice(0, 20) ?? null,
    p_avatar: p.avatar ?? null,
  });
  return !error;
}

/** Invitado → cuenta nueva: enlaza el correo al usuario anónimo (envía confirmación). */
export async function linkGuestEmail(email: string, displayName: string): Promise<{ ok: true } | { ok: false; reason: 'email_taken' | 'invalid' | 'error' }> {
  if (displayName.trim()) await updateMyProfile({ displayName });
  const { error } = await supabase.auth.updateUser(
    { email, data: { display_name: displayName.trim() } },
    { emailRedirectTo: `${window.location.origin}/auth?mode=set-password` },
  );
  if (!error) return { ok: true };
  const msg = error.message.toLowerCase();
  if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) return { ok: false, reason: 'email_taken' };
  if (msg.includes('valid')) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'error' };
}

/** Paso 2 del enlace: contraseña (solo con el correo ya confirmado). */
export async function setAccountPassword(password: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ password });
  return !error;
}

/** Antes de iniciar sesión con otra cuenta desde una sesión anónima: ticket para traer el progreso. */
export async function prepareTransfer(): Promise<void> {
  try {
    if (!(await isAnonymousSession())) return;
    const { data, error } = await supabase.rpc('create_transfer_ticket');
    if (!error && typeof data === 'string') localStorage.setItem(TRANSFER_KEY, JSON.stringify({ ticket: data, at: Date.now() }));
  } catch { /* sin migración aplicada: se pierde el traslado, no el login */ }
}

/** Tras iniciar sesión: canjea el ticket (si hay) y devuelve cuántas partidas se trajeron. */
export async function redeemTransfer(): Promise<number> {
  try {
    const raw = localStorage.getItem(TRANSFER_KEY);
    if (!raw) return 0;
    const { ticket, at } = JSON.parse(raw) as { ticket: string; at: number };
    if (Date.now() - at > 30 * 60 * 1000) { localStorage.removeItem(TRANSFER_KEY); return 0; }
    if (await isAnonymousSession()) return 0; // todavía no cambió de cuenta
    const { data, error } = await supabase.rpc('redeem_transfer_ticket', { p_ticket: ticket });
    localStorage.removeItem(TRANSFER_KEY);
    if (error) return 0;
    return Number((data as { moved_games?: number } | null)?.moved_games ?? 0);
  } catch { return 0; }
}

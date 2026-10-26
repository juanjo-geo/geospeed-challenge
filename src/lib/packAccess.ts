/**
 * Acceso a los packs Pro (Fase 7b). Decisión de JuanJo (2026-10-23): vienen incluidos en Pro y, sin Pro, se puede
 * jugar una partida de prueba gratis al día en cada pack (día local). El pack Colombia es gratis.
 * Desde 2026-10-26 el servidor también la controla (claim_pack_trial, día de Colombia): borrar los datos o reinstalar
 * ya no la devuelve, y la partida de un pack sin Pro que no sea la de prueba queda fuera del ranking.
 */
import type { GameMode } from '@/data/cities';
import { isPro } from '@/lib/premiumSystem';
import { localDate } from '@/lib/interruptions';

export const PRO_PACK_MODES: GameMode[] = ['andes', 'conosur', 'mexcam', 'caribe'];
export const isProPack = (mode: string | null | undefined): boolean => PRO_PACK_MODES.includes(mode as GameMode);

const KEY = 'geospeed_pack_trials';
function readTrials(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { return {}; }
}

/** ¿Puede jugar este pack ahora? (gratis, Pro, o aún no usó la prueba de hoy) */
export function canPlayPack(mode: string): boolean {
  if (!isProPack(mode) || isPro()) return true;
  return readTrials()[mode] !== localDate();
}

/** ¿La próxima partida en este pack sería la de prueba? (para avisarlo en Inicio) */
export const isPackTrial = (mode: string): boolean => isProPack(mode) && !isPro();

/** Gasta la partida de prueba de hoy en este pack (solo sin Pro) */
export function markPackTrial(mode: string): void {
  if (!isProPack(mode) || isPro()) return;
  try { localStorage.setItem(KEY, JSON.stringify({ ...readTrials(), [mode]: localDate() })); } catch { /* sin almacenamiento */ }
}

/** Devuelve la partida de prueba de hoy (se canceló en la cuenta regresiva: la partida no empezó) */
export function refundPackTrial(mode: string): void {
  if (!isProPack(mode) || isPro()) return;
  const trials = readTrials();
  if (trials[mode] !== localDate()) return;
  delete trials[mode];
  try { localStorage.setItem(KEY, JSON.stringify(trials)); } catch { /* sin almacenamiento */ }
  void serverRpc('refund_pack_trial', mode);
}

const CLAIM_TIMEOUT_MS = 4000;

/** Llama una RPC de la prueba; null = no se pudo preguntar (sin sesión, sin red o migración sin aplicar) */
async function serverRpc(fn: 'claim_pack_trial' | 'refund_pack_trial', mode: string): Promise<boolean | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
    // Import dinámico: catalog.ts importa este módulo y no debe arrastrar el cliente de Supabase
    const [{ ensureGuestSession }, { supabase }] = await Promise.all([import('@/lib/identity'), import('@/integrations/supabase/client')]);
    if (fn === 'claim_pack_trial' && (await ensureGuestSession()) === 'unavailable') return null;
    const call = supabase.rpc(fn, { p_mode: mode }).then(({ data, error }) => (error ? null : fn === 'claim_pack_trial' ? data === true : true));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), CLAIM_TIMEOUT_MS));
    return await Promise.race([call, timeout]);
  } catch {
    return null;
  }
}

/**
 * Reclama la partida de prueba de hoy antes de empezar (solo sin Pro en un pack Pro). Pregunta al servidor; si no
 * se puede preguntar decide la marca local (la partida igual se guarda y el servidor la deja fuera del ranking si no
 * era la de prueba). true = puede jugar; la prueba queda gastada en el teléfono también.
 */
export async function claimPackTrial(mode: string): Promise<boolean> {
  if (!isProPack(mode) || isPro()) return true;
  if (!canPlayPack(mode)) return false;
  const server = await serverRpc('claim_pack_trial', mode);
  markPackTrial(mode); // también cuando el servidor dice que ya la usó (otro teléfono): Inicio lo muestra
  return server !== false;
}

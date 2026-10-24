/**
 * Acceso a los packs Pro (Fase 7b). Decisión de JuanJo (2026-10-23): vienen incluidos en Pro y, sin Pro, se puede
 * jugar una partida de prueba gratis al día en cada pack (día local). El pack Colombia es gratis.
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
}

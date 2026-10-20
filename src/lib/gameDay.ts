/**
 * Día de juego (Fase 2, decisión de JuanJo 2026-10-20): el desafío diario, la racha y los cupos diarios
 * cambian a la MEDIANOCHE DE COLOMBIA para todos (Colombia no tiene horario de verano: UTC−5 fijo).
 * Antes el diario usaba la fecha UTC y en Colombia cambiaba a las 7 p. m.
 *
 * El servidor usa la misma regla (`game_day()`, `daily_number()` en la migración daily_streak).
 */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
/** Primer diario (#1). El 21-10-2026 es el #163. */
export const DAILY_EPOCH = '2026-05-12';

/** Fecha del día de juego en Colombia: 'YYYY-MM-DD' */
export function gameDay(at: Date = new Date()): string {
  return new Date(at.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Número del diario de un día ('YYYY-MM-DD'): #1 = 12-05-2026 */
export function dailyNumber(day: string = gameDay()): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${DAILY_EPOCH}T00:00:00Z`)) / 86_400_000) + 1;
}

/** Día ('YYYY-MM-DD') de un número de diario */
export function dailyDay(no: number): string {
  return new Date(Date.parse(`${DAILY_EPOCH}T00:00:00Z`) + (no - 1) * 86_400_000).toISOString().slice(0, 10);
}

/** Semilla de las ciudades del diario: la misma para todos ese día */
export function dailySeed(day: string = gameDay()): number {
  let hash = 0;
  for (let i = 0; i < day.length; i++) {
    hash = ((hash << 5) - hash) + day.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Próximo cambio de día (medianoche de Colombia = 05:00 UTC) */
export function nextRollover(at: Date = new Date()): Date {
  const next = new Date(Date.parse(`${gameDay(at)}T05:00:00Z`) + 86_400_000);
  return next;
}

/** Clave local del mejor puntaje del diario de hoy (también la usa el Inicio y los niveles) */
export const dailyBestKey = (day: string = gameDay()) => `geospeed_daily_${day}`;

/**
 * Link para compartir el diario (Fase 2): /d/<n>?r=<nombre>&h=<aciertos>&t=<segundos>&g=<cuadritos>[&l=en].
 * Sin imports a propósito: también lo usan las funciones de Vercel de la vista previa (api/daily-page.ts y
 * api/og-daily.ts), que no deben cargar el cliente de Supabase.
 */
export const SHARE_ORIGIN = 'https://geospeed-challenge.vercel.app';

/** Ciudades del diario (el texto para compartir dice "11/13") */
export const DAILY_TOTAL = 13;

/** Nombre corto para el link (?r=): sin espacios ni símbolos */
export const shareName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '').slice(0, 16) || 'amigo';

export interface DailyShareData { dailyNo: number; hits: number; total: number; timeMs: number; grid: string; streak: number; name: string; lang?: string }

/** Link del diario con el resultado de quien lo comparte (para la comparación al final, sin cuenta).
 *  `l=en` solo si se juega en inglés: la vista previa de WhatsApp sale en ese idioma. */
export function dailyLink(d: DailyShareData): string {
  const p = new URLSearchParams({ r: shareName(d.name), h: String(d.hits), t: String(Math.round(d.timeMs / 1000)), g: d.grid });
  if (d.lang === 'en') p.set('l', 'en');
  return `${SHARE_ORIGIN}/d/${d.dailyNo}?${p.toString()}`;
}

/** Resultado de quien envió el link (/d/<n>?r=…&h=…&t=…&g=…), para "Juanjo hizo 8/13 en 42 s. ¿Le ganas?" */
export interface DailyInvite { dailyNo: number; name: string; hits: number; timeS: number; grid: string }
export function parseDailyInvite(no: number, search: string): DailyInvite | null {
  const p = new URLSearchParams(search);
  const name = (p.get('r') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
  const hits = parseInt(p.get('h') || '', 10);
  const timeS = parseInt(p.get('t') || '', 10);
  const grid = (p.get('g') || '').replace(/[^GYRX]/g, '').slice(0, 30);
  if (!name || !Number.isFinite(no)) return null;
  return { dailyNo: no, name, hits: Number.isFinite(hits) ? hits : 0, timeS: Number.isFinite(timeS) ? timeS : 0, grid };
}

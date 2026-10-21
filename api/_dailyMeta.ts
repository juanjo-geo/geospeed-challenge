/**
 * Datos y textos de la vista previa del link del diario (Fase 2b), compartidos por api/daily-page.ts
 * (etiquetas og: para WhatsApp, Telegram, iMessage…) y api/og-daily.ts (la imagen).
 */
import { parseDailyInvite, DAILY_TOTAL, type DailyInvite } from '../src/lib/dailyShare';
import { dailyDay } from '../src/lib/gameDay';

export { DAILY_TOTAL };
export type Lang = 'es' | 'en';

export interface DailyQuery { no: number; invite: DailyInvite | null; lang: Lang }

/** Lee n (número del diario) y el resultado de quien compartió; null si el número no sirve */
export function readDailyQuery(url: URL): DailyQuery | null {
  const no = Number(url.searchParams.get('n'));
  if (!Number.isInteger(no) || no < 1 || no > 99999) return null;
  const lang: Lang = url.searchParams.get('l') === 'en' ? 'en' : 'es';
  const invite = parseDailyInvite(no, url.search);
  if (invite) invite.hits = Math.max(0, Math.min(DAILY_TOTAL, invite.hits));
  if (invite) invite.timeS = Math.max(0, Math.min(9999, invite.timeS));
  if (invite) invite.grid = invite.grid.slice(0, DAILY_TOTAL);
  return { no, invite, lang };
}

/** Parámetros limpios del resultado (sin n), para armar el link y la URL de la imagen */
export function inviteParams(q: DailyQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.invite) {
    p.set('r', q.invite.name);
    p.set('h', String(q.invite.hits));
    p.set('t', String(q.invite.timeS));
    if (q.invite.grid) p.set('g', q.invite.grid);
  }
  if (q.lang === 'en') p.set('l', 'en');
  return p;
}

const MONTHS: Record<Lang, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "21 de octubre de 2026" / "October 21, 2026" (día de juego de Colombia del diario n) */
export function dailyDateLabel(no: number, lang: Lang): string {
  const [y, m, d] = dailyDay(no).split('-').map(Number);
  return lang === 'en' ? `${MONTHS.en[m - 1]} ${d}, ${y}` : `${d} de ${MONTHS.es[m - 1]} de ${y}`;
}

export function dailyTexts(q: DailyQuery) {
  const { no, invite, lang } = q;
  const n = DAILY_TOTAL;
  if (lang === 'en') {
    return {
      title: invite ? `${invite.name} got ${invite.hits}/${n} on GeoSpeed Daily #${no}. Can you beat them?` : `GeoSpeed Daily #${no}: how well do you know the world?`,
      description: `The same ${n} cities for everyone. Play free in your browser, no account needed.`,
      alt: invite ? `${invite.name}'s result on GeoSpeed Daily #${no}` : `GeoSpeed Daily #${no}`,
      badge: `DAILY #${no}`,
      did: invite ? (invite.timeS > 0 ? `got ${invite.hits}/${n} in ${invite.timeS} s` : `got ${invite.hits}/${n}`) : '',
      ask: ['How well do you know', 'the world?'],
      same: `The same ${n} cities for everyone.`,
      cta: invite ? 'Can you beat them? Play free' : "Play today's daily",
    };
  }
  return {
    title: invite ? `${invite.name} hizo ${invite.hits}/${n} en el Diario #${no} de GeoSpeed. ¿Le ganas?` : `Desafío diario #${no} de GeoSpeed: ¿cuánto conoces el mundo?`,
    description: `Las mismas ${n} ciudades para todo el mundo. Juega gratis en el navegador, sin crear cuenta.`,
    alt: invite ? `Resultado de ${invite.name} en el Diario #${no} de GeoSpeed` : `Diario #${no} de GeoSpeed`,
    badge: `DIARIO #${no}`,
    did: invite ? (invite.timeS > 0 ? `hizo ${invite.hits}/${n} en ${invite.timeS} s` : `hizo ${invite.hits}/${n}`) : '',
    ask: ['¿Cuánto conoces', 'el mundo?'],
    same: `Las mismas ${n} ciudades para todos.`,
    cta: invite ? '¿Le ganas? Juega gratis' : 'Juega el diario de hoy',
  };
}

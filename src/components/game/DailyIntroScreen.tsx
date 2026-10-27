import { lazy, Suspense, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import FavStar from './FavStar';
import { formatNumber } from '@/lib/format';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ChevronIcon } from '@/components/ui/icons';
import Mascot from './Mascot';
import { gameDay, dailyNumber, nextRollover, dailyBestKey, timeUntilRollover } from '@/lib/gameDay';
import { fetchDailyStatus, getCachedDailyStatus, playedToday, DAILY_STATUS_EVENT, type DailyInvite, type DailyStatus } from '@/lib/dailyChallenge';
import { requestOpenStreak } from './StreakChip';
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface DailyIntroScreenProps {
  onBack: () => void;
  /** Empieza el desafío (consume una vida, cuenta regresiva) */
  onPlay: () => void;
  /** Llegó por el link de un amigo (/d/<n>?r=…): su resultado para retarlo */
  invite?: DailyInvite | null;
}

/**
 * Desafío diario (maqueta Desafio_Diario_APROBADA_v1): presentación antes de jugar — el Explorador con el
 * globo y el calendario del día, "El reto de hoy" con sus tres reglas, mejor resultado de hoy si ya jugó,
 * hora del cambio (D6) y JUGAR DESAFÍO.
 */
export default function DailyIntroScreen({ onBack, onPlay, invite = null }: DailyIntroScreenProps) {
  const { t, locale } = useI18n();
  const now = new Date();
  const dateLocale = locale === 'en' ? 'en-US' : 'es-CO';
  // Día de juego de Colombia (medianoche de Colombia para todos); la hora del cambio se muestra en local
  const day = gameDay(now);
  const dailyNo = dailyNumber(day);
  const dayLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(/\s+de\s+/i, ' ').toUpperCase();
  const rollover = nextRollover(now).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  let bestToday = 0;
  try { bestToday = parseInt(localStorage.getItem(dailyBestKey(day)) || '0', 10); } catch { /* sin almacenamiento */ }
  // Racha y resultado de hoy (servidor; mientras llega, lo último guardado)
  const [st, setSt] = useState<DailyStatus | null>(getCachedDailyStatus);
  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<DailyStatus>).detail);
    window.addEventListener(DAILY_STATUS_EVENT, on);
    fetchDailyStatus();
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);
  const streak = st?.current_streak ?? 0;
  const done = playedToday(st);
  const todayRes = st?.today === day ? st.today_result : null;

  const rules = [
    { icon: '🌍', title: t('daily_r1Title'), desc: t('daily_r1Desc') },
    { icon: '⏱️', title: t('daily_r2Title'), desc: t('daily_r2Desc') },
    { icon: '🏆', title: t('daily_r3Title'), desc: t('daily_r3Desc') },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={t('home_dailyCard')}
          subtitle={t('daily_subtitle')}
          titleAside={
            <span className="shrink-0 inline-flex flex-col items-center rounded-xl border-2 border-foreground/25 bg-background/50 px-2.5 py-1 text-xs sm:text-sm font-bold whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {dayLabel}</span>
              <span className="text-primary text-[11px] sm:text-xs">{t('daily_number', { n: dailyNo })}</span>
            </span>
          }
        />

        {invite && (
          <div className="mb-4 rounded-2xl border-2 border-primary/60 bg-primary/10 px-4 py-3 text-center animate-fade-in">
            <p className="font-extrabold text-lg">🏁 {t('daily_inviteBanner', { name: invite.name, hits: invite.hits, total: 13, s: invite.timeS })}</p>
            {invite.dailyNo !== dailyNo && <p className="text-xs text-muted-foreground">{t('daily_invitePast', { n: invite.dailyNo })}</p>}
          </div>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-center">
          {/* Ilustración: el Explorador junto al globo y el calendario del día */}
          <div className="relative flex items-end justify-center gap-2 mb-4 md:mb-0 short:hidden" aria-hidden>
            <span className="block w-[34vw] max-w-[170px]"><Mascot state="wink" className="w-full" /></span>
            <div className="relative w-[34vw] max-w-[170px] mb-1 rounded-full shadow-[0_0_30px_hsl(var(--accent)/0.45)]">
              <Suspense fallback={<div className="w-full aspect-square rounded-full bg-accent/20" />}><SplashGlobe /></Suspense>
              <span className="absolute -top-6 -right-4 w-16 sm:w-20 rotate-6 rounded-xl bg-white shadow-xl overflow-hidden text-center">
                <span className="block h-3 sm:h-4 bg-destructive" />
                <span className="block text-3xl sm:text-4xl font-extrabold leading-tight text-brand-navy-deep">{now.getDate()}</span>
              </span>
              <span className="absolute -top-8 right-10 text-primary text-lg">✦</span>
            </div>
          </div>

          <section className="rounded-3xl border-2 border-accent/45 bg-card/75 p-4 sm:p-5 shadow-[0_0_20px_hsl(var(--accent)/0.10)]">
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold mb-3">
              <DocIcon className="w-9 h-9 text-accent" /> {t('daily_todayLead')} <span className="text-primary -ml-1.5">{t('daily_todayTail')}</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              {rules.map(r => (
                <div key={r.title} className="flex items-center gap-3 rounded-2xl border border-foreground/15 bg-background/40 px-3 py-3">
                  <span className="text-4xl sm:text-5xl w-14 text-center shrink-0" aria-hidden>{r.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-bold text-base sm:text-lg leading-tight">{r.title}</span>
                    <span className="block text-sm text-foreground/75 leading-snug mt-0.5">{r.desc}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-start justify-center gap-2 text-sm">
              <InfoIcon className="w-5 h-5 text-accent mt-0.5" />
              <p>
                {t('daily_reveal')}
                <span className="block text-xs text-foreground/70">{t('daily_newIn', { time: timeUntilRollover(now), clock: rollover })}</span>
              </p>
            </div>
          </section>
        </div>

        {/* Racha del diario */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold">
          <button onClick={() => { playButtonTap(); requestOpenStreak(); }} className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/60 px-3 py-1 text-primary font-extrabold hover:bg-primary/10">
            🔥 {streak} · 🛡️ {st?.freezes ?? 1} <span className="font-semibold text-foreground/80">· {t('streak_seeMine')}</span>
          </button>
        </div>
        {done && todayRes && (
          <p className="mt-2 text-center text-sm text-accent font-semibold">✓ {t('daily_doneToday', { hits: todayRes.hits, total: todayRes.total, s: Math.round(todayRes.time_ms / 1000) })}</p>
        )}

        <p className="mt-4 text-center text-sm font-semibold">
          {bestToday > 0
            ? <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 px-3 py-1 text-accent">🏆 {t('daily_bestToday', { score: formatNumber(bestToday) })}</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1 text-primary">❤️ {t('daily_bonus')}</span>}
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button onClick={() => { playButtonTap(); onPlay(); }} className="btn3d w-full max-w-xl rounded-2xl py-4 short:py-2.5 font-black text-xl sm:text-2xl text-primary-foreground flex items-center justify-center gap-3" style={{ background: 'var(--grad-cta)' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
            {t('daily_play')}
          </button>
          <button onClick={() => { playButtonTap(); onBack(); }} className="w-full max-w-xl rounded-2xl py-3 border-2 border-accent/50 font-bold flex items-center justify-center gap-2 hover:bg-accent/10 active:scale-[0.98]">
            <ChevronIcon dir="left" className="w-5 h-5" /> {t('ob_backHome')}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><FavStar type="mode" id="daily" /> {t('fav_title')}</span>
        </div>
      </div>
    </div>
  );
}

type I = { className?: string };
const CalendarIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
const DocIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="3" width="16" height="18" rx="3" fill="currentColor" fillOpacity="0.15" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
);
const InfoIcon = ({ className = '' }: I) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></svg>
);

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import {
  fetchDailyStatus, getCachedDailyStatus, playedToday, setActiveCosmetics, DAILY_STATUS_EVENT,
  STREAK_MILESTONES, FRAME_STYLE, TITLE_KEY, type DailyStatus,
} from '@/lib/dailyChallenge';
import { gameDay } from '@/lib/gameDay';

interface StreakScreenProps {
  onBack: () => void;
  /** Abre el desafío diario (presentación) */
  onPlayDaily: () => void;
}

const WEEKS = 6;

/**
 * Tu racha (Fase 2): días seguidos con el diario terminado, récord, protectores, calendario de las
 * últimas semanas (jugado / cubierto con protector / hoy), vitrina de hitos (ganados a color, los
 * pendientes en gris con los días que faltan) y el título y marco que se muestran en el ranking.
 */
export default function StreakScreen({ onBack, onPlayDaily }: StreakScreenProps) {
  const { t, locale } = useI18n();
  const [st, setSt] = useState<DailyStatus | null>(getCachedDailyStatus);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dateLocale = locale === 'en' ? 'en-US' : 'es-CO';

  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<DailyStatus>).detail);
    window.addEventListener(DAILY_STATUS_EVENT, on);
    fetchDailyStatus().finally(() => setLoading(false));
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);

  const today = st?.today ?? gameDay();
  const streak = st?.current_streak ?? 0;
  const best = st?.best_streak ?? 0;
  const done = playedToday(st);
  const earned = new Set((st?.badges ?? []).map((b) => b.id));

  // Calendario: semanas de lunes a domingo que terminan en la de hoy
  const cells = useMemo(() => {
    const played = new Set(st?.played ?? []);
    const frozen = new Set(st?.frozen ?? []);
    const t0 = Date.parse(`${today}T00:00:00Z`);
    const dow = (new Date(t0).getUTCDay() + 6) % 7; // lunes = 0
    const start = t0 - (dow + (WEEKS - 1) * 7) * 86_400_000;
    return Array.from({ length: WEEKS * 7 }, (_, i) => {
      const d = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      return { d, day: Number(d.slice(8)), played: played.has(d), frozen: frozen.has(d), isToday: d === today, future: d > today };
    });
  }, [st, today]);
  const weekdays = useMemo(() => {
    const base = Date.parse('2026-10-19T12:00:00Z'); // un lunes
    return Array.from({ length: 7 }, (_, i) => new Date(base + i * 86_400_000).toLocaleDateString(dateLocale, { weekday: 'narrow', timeZone: 'UTC' }));
  }, [dateLocale]);
  const monthRaw = new Date(`${today}T12:00:00Z`).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);

  const refillDays = st?.freeze_refill_on ? Math.max(0, Math.round((Date.parse(`${st.freeze_refill_on}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)) : null;
  const titles = STREAK_MILESTONES.filter((m) => m.title);
  const frames = STREAK_MILESTONES.filter((m) => m.frame);

  const equip = async (title: string | null, frame: string | null) => {
    playButtonTap();
    setSaving(true);
    await setActiveCosmetics(title, frame);
    setSaving(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('streak_title')} subtitle={t('streak_subtitle')} />

        <div className="md:grid md:grid-cols-2 md:gap-5">
          {/* Racha actual, récord y protectores */}
          <section className="rounded-3xl border-2 border-primary/50 bg-card/75 p-4 sm:p-5 shadow-[0_0_24px_hsl(var(--primary)/0.15)] flex items-center gap-4">
            <Mascot state={streak >= 7 ? 'cheer' : streak > 0 ? 'happy' : 'thinking'} className="w-20 sm:w-24 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-5xl sm:text-6xl font-black text-primary leading-none">🔥 {streak}</p>
              <p className="font-bold text-lg">{streak === 1 ? t('streak_dayOne') : t('streak_days', { n: streak })}</p>
              <p className="text-sm text-muted-foreground">{t('streak_best', { n: best })}</p>
              <p className="mt-1.5 text-sm font-semibold">
                🛡️ {t('streak_freezes', { n: st?.freezes ?? 1, cap: st?.freeze_cap ?? 1 })}
                {refillDays != null && (st?.freezes ?? 1) < (st?.freeze_cap ?? 1) && <span className="text-muted-foreground font-normal"> · {t('streak_refillIn', { n: refillDays })}</span>}
              </p>
            </div>
          </section>

          <section className="mt-3 md:mt-0 rounded-3xl border-2 border-accent/40 bg-card/70 p-4 flex flex-col justify-center gap-3">
            {done ? (
              <p className="text-center font-bold text-accent text-lg">✓ {t('streak_doneToday')}</p>
            ) : (
              <>
                <p className="text-center font-semibold">{streak > 0 ? t('streak_keepIt', { n: streak }) : t('streak_startOne')}</p>
                <button onClick={() => { playButtonTap(); onPlayDaily(); }} className="btn3d w-full rounded-2xl py-3 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
                  📅 {t('streak_playDaily')}
                </button>
              </>
            )}
            <p className="text-xs text-center text-muted-foreground">{t('streak_howFreezes')}</p>
          </section>
        </div>

        {/* Calendario */}
        <section className="mt-4 rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
          <h2 className="font-extrabold text-lg mb-2">{monthLabel}</h2>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {weekdays.map((w, i) => <span key={i} className="text-[11px] font-bold text-muted-foreground uppercase">{w}</span>)}
            {cells.map((c) => (
              <span
                key={c.d}
                title={c.d}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm font-bold border ${
                  c.played ? 'bg-accent/80 text-brand-navy-deep border-accent'
                  : c.frozen ? 'bg-brand-sky/25 border-brand-sky/60 text-foreground'
                  : c.future ? 'border-transparent text-foreground/20'
                  : 'border-foreground/10 text-foreground/45'
                } ${c.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
              >
                <span className="leading-none">{c.day}</span>
                {c.played && <span className="text-[9px] leading-none mt-0.5" aria-hidden>✓</span>}
                {c.frozen && <span className="text-[9px] leading-none mt-0.5" aria-hidden>🛡️</span>}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span><span className="inline-block w-3 h-3 rounded bg-accent/80 align-[-2px] mr-1" />{t('streak_legendPlayed')}</span>
            <span><span className="inline-block w-3 h-3 rounded bg-brand-sky/40 align-[-2px] mr-1" />{t('streak_legendFrozen')}</span>
            <span><span className="inline-block w-3 h-3 rounded ring-2 ring-primary align-[-2px] mr-1" />{t('streak_legendToday')}</span>
          </div>
        </section>

        {/* Vitrina de hitos */}
        <section className="mt-4">
          <h2 className="font-extrabold text-xl mb-2">{t('streak_milestones')}</h2>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 gap-2.5">
            {STREAK_MILESTONES.map((m) => {
              const got = earned.has(m.badge);
              const left = Math.max(0, m.days - streak);
              return (
                <div key={m.badge} className={`rounded-2xl border-2 p-3 flex gap-3 items-start ${got ? 'border-primary/60 bg-primary/10' : 'border-foreground/10 bg-background/30 grayscale opacity-70'}`}>
                  <span className="text-3xl leading-none" aria-hidden>{m.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-extrabold leading-tight">{t(m.nameKey as never)}</span>
                    <span className="block text-xs text-muted-foreground">{t('streak_daysShort', { n: m.days })} · {t(m.rewardKey as never)}</span>
                    <span className={`block text-xs font-bold mt-0.5 ${got ? 'text-accent' : 'text-foreground/60'}`}>{got ? `✓ ${t('streak_earned')}` : left === 1 ? t('streak_leftOne') : t('streak_left', { n: left })}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Título y marco (lo ven otros en el ranking) */}
        <section className="mt-4 rounded-3xl border-2 border-accent/30 bg-card/60 p-4">
          <h2 className="font-extrabold text-lg">{t('streak_showOff')}</h2>
          <p className="text-xs text-muted-foreground mb-2">{t('streak_showOffDesc')}</p>
          <p className="text-sm font-bold mb-1">{t('streak_titleLabel')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <ChoiceChip active={!st?.active_title} disabled={saving} onClick={() => equip(null, st?.active_frame ?? null)} label={t('streak_none')} />
            {titles.map((m) => (
              <ChoiceChip key={m.title} active={st?.active_title === m.title} disabled={saving || !earned.has(m.badge)} locked={!earned.has(m.badge)} onClick={() => equip(m.title!, st?.active_frame ?? null)} label={t(TITLE_KEY[m.title!] as never)} />
            ))}
          </div>
          <p className="text-sm font-bold mb-1">{t('streak_frameLabel')}</p>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip active={!st?.active_frame} disabled={saving} onClick={() => equip(st?.active_title ?? null, null)} label={t('streak_none')} />
            {frames.map((m) => (
              <ChoiceChip key={m.frame} active={st?.active_frame === m.frame} disabled={saving || !earned.has(m.badge)} locked={!earned.has(m.badge)} onClick={() => equip(st?.active_title ?? null, m.frame!)}
                label={t(`frame_${m.frame}` as never)} swatch={FRAME_STYLE[m.frame!].ring} />
            ))}
          </div>
        </section>

        {!loading && !st && <p className="mt-4 text-center text-sm text-muted-foreground">{t('streak_noSession')}</p>}
      </div>
    </div>
  );
}

function ChoiceChip({ label, active, disabled, locked, onClick, swatch }: { label: string; active: boolean; disabled?: boolean; locked?: boolean; onClick: () => void; swatch?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-3 py-1 text-sm font-bold inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed ${active ? 'border-primary bg-primary/15 text-primary' : 'border-foreground/20 text-foreground/80 hover:border-accent/60'} ${locked ? 'opacity-50' : ''}`}
    >
      {swatch && <span className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: swatch, boxShadow: `0 0 6px ${swatch}` }} aria-hidden />}
      {locked && <span aria-hidden>🔒</span>}
      {label}
    </button>
  );
}

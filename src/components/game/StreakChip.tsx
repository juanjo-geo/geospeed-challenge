import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { getCachedDailyStatus, fetchDailyStatus, playedToday, DAILY_STATUS_EVENT, type DailyStatus } from '@/lib/dailyChallenge';

/** Abre la pantalla de la racha desde cualquier lugar (Index escucha el evento) */
export const OPEN_STREAK_EVENT = 'geospeed:open-streak';
export const requestOpenStreak = () => window.dispatchEvent(new Event(OPEN_STREAK_EVENT));

let refreshedThisLoad = false;

/**
 * 🔥 + días de racha del diario (Fase 2). Se ve en el encabezado del Inicio y en la barra de computador.
 * En riesgo (hay racha y aún no se jugó el diario de hoy) late suavemente. Toca para ver el calendario.
 */
export default function StreakChip({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const [st, setSt] = useState<DailyStatus | null>(getCachedDailyStatus);

  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<DailyStatus>).detail);
    window.addEventListener(DAILY_STATUS_EVENT, on);
    if (!refreshedThisLoad) { refreshedThisLoad = true; fetchDailyStatus(); }
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);

  const streak = st?.current_streak ?? 0;
  const done = playedToday(st);
  const atRisk = streak > 0 && !done;
  const label = streak > 0
    ? t('streak_chipAria', { n: streak }) + (atRisk ? ` · ${t('streak_atRisk')}` : '')
    : t('streak_chipStart');

  return (
    <button
      type="button"
      onClick={() => { playButtonTap(); requestOpenStreak(); }}
      className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-sm font-extrabold transition-colors ${streak > 0 ? 'border-primary/60 text-primary' : 'border-foreground/20 text-foreground/60'} ${atRisk ? 'animate-pulse-glow-subtle' : ''} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className={streak > 0 ? '' : 'grayscale opacity-60'} aria-hidden>🔥</span>
      <span>{streak}</span>
    </button>
  );
}

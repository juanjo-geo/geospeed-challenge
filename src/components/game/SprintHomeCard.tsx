import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { formatNumber } from '@/lib/format';
import { useSprintStatus, divisionByKey, divisionProgress } from '@/lib/sprint';

/**
 * Botón del Sprint en el Inicio (Fase 5, §1): división actual, PS con su barra y carreras gratis que quedan hoy;
 * bloqueado, dice qué falta (cuenta o partidas). Avisa si hay carreras nuevas en la bandeja.
 */
export default function SprintHomeCard({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  const st = useSprintStatus();
  const unlocked = !!st?.unlocked;
  const div = divisionByKey(st?.division ?? 'ciudad');
  const prog = divisionProgress(st?.points ?? 1000);
  const left = st?.day_limit == null ? null : Math.max(0, st.day_limit - (st.day_used ?? 0));
  const inbox = st?.inbox?.length ?? 0;
  const lockText = !st?.registered ? t('sprint_homeLockedAccount') : t('sprint_homeLockedGames', { n: Math.max(0, (st?.games_needed ?? 5) - (st?.games_played ?? 0)) });

  return (
    <button
      onClick={() => { playButtonTap(); onOpen(); }}
      className="relative w-full flex items-center gap-3 rounded-2xl border-2 border-primary/60 bg-card/80 px-3 sm:px-4 py-2.5 text-left shadow-[0_0_16px_hsl(var(--primary)/0.15)] active:scale-[0.99] transition-transform"
      aria-label={t('sprint_title')}
    >
      <span className="text-3xl sm:text-4xl leading-none" aria-hidden>{unlocked ? div.emoji : '⚡'}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="font-black text-lg leading-tight">⚡ Sprint</span>
          {unlocked && <span className="text-sm font-bold text-foreground/80 truncate">{t(`sprint_div_${div.key}` as never)} · {formatNumber(st!.points)} PS</span>}
        </span>
        {unlocked ? (
          <span className="mt-1 block h-1.5 rounded-full bg-foreground/10 overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(prog.pct * 100)}%` }} /></span>
        ) : (
          <span className="block text-xs sm:text-sm text-foreground/75 truncate">🔒 {lockText}</span>
        )}
      </span>
      {unlocked && (
        <span className="shrink-0 rounded-full border-2 border-accent/60 px-2.5 py-0.5 text-sm font-black text-accent">{left == null ? '∞' : `⚡ ${left}`}</span>
      )}
      {inbox > 0 && (
        <span className="absolute -top-2 right-3 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-black text-white shadow">{t('sprint_inboxBadge', { n: inbox })}</span>
      )}
    </button>
  );
}

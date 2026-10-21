import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import Mascot from './Mascot';

/**
 * Racha perdida (Fase 2): pantalla empática que muestra la racha que terminó y el récord, y anima a
 * empezar otra con el diario de hoy. Se muestra una sola vez por racha perdida (Index lo recuerda).
 */
export default function StreakLostModal({ lost, best, onPlay, onClose }: { lost: number; best: number; onPlay: () => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="modal-layer z-[80] bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={t('streak_lostTitle', { n: lost })} onClick={onClose}>
      <div className="modal-panel w-full max-w-sm rounded-3xl border-2 border-accent/40 bg-card p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Mascot state="down" className="w-24 mx-auto" />
        <h2 className="mt-2 text-2xl font-extrabold leading-tight">{t('streak_lostTitle', { n: lost })}</h2>
        <p className="mt-2 text-sm text-foreground/80">{t('streak_lostBody')}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1 text-sm font-bold text-primary">🏆 {t('streak_best', { n: Math.max(best, lost) })}</p>
        <button onClick={() => { playButtonTap(); onPlay(); }} className="btn3d mt-4 w-full rounded-2xl py-3 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          🔥 {t('streak_lostCta')}
        </button>
        <button onClick={() => { playButtonTap(); onClose(); }} className="mt-2 w-full rounded-2xl py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">{t('streak_notNow')}</button>
      </div>
    </div>
  );
}

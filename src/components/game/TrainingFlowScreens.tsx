import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import Flag from '@/components/ui/Flag';
import Mascot from './Mascot';
import type { City, GameMode } from '@/data/cities';

/**
 * Entrenamiento y repaso (Fase 4): entre tandas, la ronda extra con las falladas ("hasta acertarlas"), y al
 * final el resumen: aciertos a la primera, cuántas hubo que repetir y el porcentaje dominado antes → después.
 */

export function TrainingRepeatScreen({ misses, onRepeat, onFinish }: { misses: City[]; onRepeat: () => void; onFinish: () => void }) {
  const { t } = useI18n();
  return (
    <div className="min-h-[100dvh] flex items-center justify-center game-bg px-4 py-6 short:py-3">
      <div className="w-full max-w-lg animate-fade-in-up text-center">
        <Mascot state="thinking" className="w-24 short:w-16 mx-auto" />
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold leading-tight">{t('train_repeatTitle')}</h1>
        <p className="mt-1 text-foreground/80">{t('train_repeatSub')}</p>
        <ul className="mt-4 short:mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-h-[40dvh] overflow-y-auto">
          {misses.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-card/70 px-3 py-2">
              <Flag country={c.country} className="w-6 shrink-0" />
              <span className="min-w-0"><span className="block font-bold truncate">{c.name}</span><span className="block text-xs text-muted-foreground truncate">{c.country}</span></span>
            </li>
          ))}
        </ul>
        <button onClick={() => { playButtonTap(); onRepeat(); }} className="btn3d mt-5 short:mt-3 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          🔁 {t('train_repeatGo', { n: misses.length })}
        </button>
        <button onClick={() => { playButtonTap(); onFinish(); }} className="mt-2 w-full rounded-2xl py-2.5 font-semibold text-muted-foreground hover:text-foreground">{t('train_finish')}</button>
      </div>
    </div>
  );
}

export interface TrainingSummary {
  kind: 'training' | 'review';
  mode: GameMode;
  firstHits: number;
  firstTotal: number;
  /** Falladas a la primera que se acertaron en las rondas extra */
  fixed: number;
  /** % dominado de la región antes y después (null mientras llega la memoria del servidor) */
  before: number | null;
  after: number | null;
}

export function TrainingResultScreen({ summary, onAgain, onSettings, onMemory, onHome }: { summary: TrainingSummary; onAgain?: () => void; onSettings?: () => void; onMemory: () => void; onHome: () => void }) {
  const { t } = useI18n();
  const s = summary;
  const ratio = s.firstTotal ? s.firstHits / s.firstTotal : 0;
  const mascot = ratio >= 0.8 ? 'cheer' : ratio >= 0.4 || s.fixed > 0 ? 'happy' : 'thinking';
  const gain = s.before != null && s.after != null ? s.after - s.before : null;
  return (
    <div className="min-h-[100dvh] flex items-center justify-center game-bg px-4 py-6 short:py-3">
      <div className="w-full max-w-lg animate-fade-in-up text-center">
        <Mascot state={mascot} className="w-24 short:w-16 mx-auto" />
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold leading-tight text-accent">{s.kind === 'review' ? t('train_reviewDoneTitle') : t('train_doneTitle')}</h1>
        <div className="mt-4 short:mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border-2 border-accent/40 bg-card/70 px-3 py-3">
            <p className="text-3xl font-black text-primary leading-none">{s.firstHits}/{s.firstTotal}</p>
            <p className="mt-1 text-xs sm:text-sm text-foreground/80">{t('train_firstTryShort')}</p>
          </div>
          <div className="rounded-2xl border-2 border-accent/40 bg-card/70 px-3 py-3">
            <p className="text-3xl font-black text-foreground leading-none">{s.fixed}/{s.firstTotal - s.firstHits}</p>
            <p className="mt-1 text-xs sm:text-sm text-foreground/80">{t('train_fixedShort')}</p>
          </div>
        </div>
        {s.kind === 'training' && (
          <div className="mt-3 rounded-2xl border-2 border-primary/40 bg-card/70 px-4 py-3 text-left">
            <p className="font-bold">{t('train_masteryLine', { region: t(`mode_${s.mode}` as never), pct: s.after ?? s.before ?? 0 })}
              {gain != null && gain > 0 && <span className="ml-2 rounded-full border-2 border-accent/70 px-2 py-0.5 text-xs font-black text-accent">+{gain} %</span>}
            </p>
            <span className="mt-2 block h-2 rounded-full bg-foreground/10 overflow-hidden"><span className="block h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${s.after ?? s.before ?? 0}%` }} /></span>
            {s.after == null && <p className="mt-1 text-xs text-muted-foreground animate-pulse">{t('train_savingMemory')}</p>}
          </div>
        )}
        <p className="mt-3 text-sm text-foreground/75">{t('train_memoryNote')}</p>
        {onAgain && (
          <button onClick={() => { playButtonTap(); onAgain(); }} className="btn3d mt-4 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
            🎯 {t('train_again')}
          </button>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {onSettings
            ? <button onClick={() => { playButtonTap(); onSettings(); }} className="rounded-2xl border-2 border-foreground/25 py-2.5 font-bold hover:bg-muted/40">{t('train_changeSettings')}</button>
            : <button onClick={() => { playButtonTap(); onMemory(); }} className="rounded-2xl border-2 border-foreground/25 py-2.5 font-bold hover:bg-muted/40">🧠 {t('train_myMemory')}</button>}
          <button onClick={() => { playButtonTap(); onHome(); }} className="rounded-2xl border-2 border-foreground/25 py-2.5 font-bold hover:bg-muted/40">{t('ob_backHome')}</button>
        </div>
      </div>
    </div>
  );
}

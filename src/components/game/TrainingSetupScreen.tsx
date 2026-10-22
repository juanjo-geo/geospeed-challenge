import { useI18n } from '@/i18n';
import { CATEGORIES, CATEGORY_ART, CATEGORY_KEY } from '@/lib/catalog';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { REGION_ART, DIFF_ORDER } from '@/lib/selectionArt';
import { TRAINING_SIZES, type TrainingCfg } from '@/lib/training';
import { useMemory, regionMastery, dueCount, TRAINING_REGIONS } from '@/lib/itemMemory';
import type { Difficulty } from '@/data/cities';

interface TrainingSetupScreenProps {
  cfg: TrainingCfg;
  onChange: (cfg: TrainingCfg) => void;
  onStart: (cfg: TrainingCfg) => void;
  onBack: () => void;
  onReview: () => void;
  onOpenMemory: () => void;
}

const DIFF_LABEL: Record<Difficulty, string> = { basic: 'home_diffBasic', easy: 'home_diffEasy', medium: 'home_diffMedium', hard: 'home_diffHard' };

/**
 * Entrenamiento (Fase 4, §3): región con su porcentaje dominado, nivel de las ciudades, tamaño de la tanda
 * (6 · 10 · 20) y reloj (15 s por ciudad o sin tiempo). Arriba, el Repaso del día si hay lugares que tocan hoy.
 */
export default function TrainingSetupScreen({ cfg, onChange, onStart, onBack, onReview, onOpenMemory }: TrainingSetupScreenProps) {
  const { t } = useI18n();
  const memory = useMemory();
  const due = dueCount(memory);
  const set = (patch: Partial<TrainingCfg>) => { playButtonTap(); onChange({ ...cfg, ...patch }); };
  const chip = (on: boolean) => `rounded-2xl border-2 px-3 py-2.5 font-bold transition-all active:scale-[0.97] ${on ? 'border-primary bg-primary/15 text-foreground shadow-[0_0_14px_hsl(var(--primary)/0.2)]' : 'border-foreground/15 bg-card/60 text-foreground/80 hover:border-foreground/30'}`;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('train_title')} subtitle={t('train_subtitle')} />

        {due > 0 && (
          <button onClick={() => { playButtonTap(); onReview(); }} className="w-full mb-4 flex items-center gap-3 rounded-3xl border-2 border-accent/70 bg-card/80 px-4 py-3 text-left shadow-[0_0_18px_hsl(var(--accent)/0.18)] active:scale-[0.99]">
            <span className="text-3xl" aria-hidden>🧠</span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-lg leading-tight">{t('train_reviewCard')}</span>
              <span className="block text-sm text-foreground/80">{due === 1 ? t('train_reviewCountOne') : t('train_reviewCount', { n: due })}</span>
            </span>
            <span className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-black text-brand-navy-deep">{t('train_reviewGo')}</span>
          </button>
        )}

        <section className="rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4 mb-3">
          <h2 className="font-extrabold text-lg mb-2">{t('train_category')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => set({ category: c })} className={`${chip(cfg.category === c)} flex items-center justify-center gap-2`} aria-pressed={cfg.category === c}>
                <span className="text-2xl leading-none" aria-hidden>{CATEGORY_ART[c].emoji}</span>{t(CATEGORY_KEY[c] as never)}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
          <h2 className="font-extrabold text-lg mb-2">{t('train_region')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {TRAINING_REGIONS.map((mode) => {
              const m = regionMastery(memory, mode);
              return (
                <button key={mode} onClick={() => set({ mode })} className={`${chip(cfg.mode === mode)} text-left`} aria-pressed={cfg.mode === mode}>
                  <span className="flex items-center gap-2"><span className="text-2xl leading-none" aria-hidden>{REGION_ART[mode].emoji}</span><span className="truncate">{t(`mode_${mode}` as never)}</span></span>
                  <span className="mt-1.5 block h-1.5 rounded-full bg-foreground/10 overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${m.pct}%` }} /></span>
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">{t('train_dominated', { pct: m.pct })}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <section className="rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
            <h2 className="font-extrabold text-lg mb-2">{t('train_cityLevel')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {DIFF_ORDER.map((d) => (
                <button key={d} onClick={() => set({ difficulty: d })} className={chip(cfg.difficulty === d)} aria-pressed={cfg.difficulty === d}>{t(DIFF_LABEL[d] as never)}</button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
            <h2 className="font-extrabold text-lg mb-2">{t('train_size')}</h2>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_SIZES.map((n) => (
                <button key={n} onClick={() => set({ size: n })} className={`${chip(cfg.size === n)} text-xl`} aria-pressed={cfg.size === n}>{n}</button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
            <h2 className="font-extrabold text-lg mb-2">{t('train_clock')}</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set({ clock: false })} className={`${chip(!cfg.clock)} text-sm`} aria-pressed={!cfg.clock}>∞ {t('train_clockOff')}</button>
              <button onClick={() => set({ clock: true })} className={`${chip(cfg.clock)} text-sm`} aria-pressed={cfg.clock}>⏱ {t('train_clockOn')}</button>
            </div>
          </section>
        </div>

        <p className="mt-4 text-sm text-center text-foreground/75 max-w-2xl mx-auto">{t('train_rules')}</p>

        <button onClick={() => { playButtonTap(); onStart(cfg); }} className="btn3d mt-4 w-full max-w-xl mx-auto block rounded-2xl py-4 font-black text-xl text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          🎯 {t('train_start')}
        </button>
        <button onClick={() => { playButtonTap(); onOpenMemory(); }} className="mt-3 mx-auto flex items-center gap-2 text-accent font-bold hover:underline">
          🧠 {t('train_myMemory')} →
        </button>
      </div>
    </div>
  );
}

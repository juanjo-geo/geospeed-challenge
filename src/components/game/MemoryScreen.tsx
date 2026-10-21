import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { REGION_ART } from '@/lib/selectionArt';
import { useMemory, memorySummary, regionMastery, nextReviewDay, TRAINING_REGIONS } from '@/lib/itemMemory';

interface MemoryScreenProps { onBack: () => void; onReview: () => void; onTrain: () => void }

/**
 * Tu memoria (Fase 4, §10): lo que el juego recuerda de tus respuestas. Por aprender (falladas, cajas 1–2) ·
 * en repaso (cajas 3–5) · dominadas; el Repaso del día (o cuándo es el próximo) y el porcentaje dominado por región.
 */
export default function MemoryScreen({ onBack, onReview, onTrain }: MemoryScreenProps) {
  const { t, locale } = useI18n();
  const memory = useMemory();
  const sum = memorySummary(memory);
  const next = nextReviewDay(memory);
  const nextLabel = next ? new Date(`${next}T12:00:00Z`).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : null;
  const tiles = [
    { key: 'toLearn', n: sum.toLearn, label: t('mem_toLearn'), cls: 'border-destructive/50 text-destructive' },
    { key: 'reviewing', n: sum.reviewing, label: t('mem_reviewing'), cls: 'border-primary/60 text-primary' },
    { key: 'dominated', n: sum.dominated, label: t('mem_dominated'), cls: 'border-accent/70 text-accent' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('mem_title')} subtitle={t('mem_subtitle')} />

        {memory.length === 0 ? (
          <section className="rounded-3xl border-2 border-accent/40 bg-card/70 p-6 text-center">
            <p className="text-5xl" aria-hidden>🧠</p>
            <p className="mt-2 font-semibold text-foreground/85">{t('mem_empty')}</p>
            <button onClick={() => { playButtonTap(); onTrain(); }} className="btn3d mt-4 w-full max-w-sm mx-auto block rounded-2xl py-3 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>🎯 {t('mem_train')}</button>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {tiles.map((x) => (
                <div key={x.key} className={`rounded-3xl border-2 bg-card/70 px-2 py-3 sm:py-4 text-center ${x.cls}`}>
                  <p className="text-3xl sm:text-4xl font-black leading-none">{x.n}</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-foreground/85">{x.label}</p>
                </div>
              ))}
            </div>

            <section className="mt-3 rounded-3xl border-2 border-accent/50 bg-card/75 p-4 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-4xl" aria-hidden>🗓️</span>
              <p className="flex-1 text-center sm:text-left font-semibold">
                {sum.due > 0 ? t('mem_dueToday', { n: sum.due }) : <>{t('mem_noneToday')} {nextLabel && t('mem_nextOn', { date: nextLabel })}</>}
              </p>
              {sum.due > 0 && (
                <button onClick={() => { playButtonTap(); onReview(); }} className="btn3d shrink-0 rounded-2xl px-6 py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>🧠 {t('train_reviewGo')}</button>
              )}
            </section>

            <section className="mt-3 rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
              <h2 className="font-extrabold text-lg mb-2">{t('mem_byRegion')}</h2>
              <ul className="flex flex-col gap-2.5">
                {TRAINING_REGIONS.map((mode) => {
                  const m = regionMastery(memory, mode);
                  return (
                    <li key={mode} className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center" aria-hidden>{REGION_ART[mode].emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2 text-sm font-bold"><span className="truncate">{t(`mode_${mode}` as never)}</span><span className="text-accent shrink-0">{m.pct}%</span></span>
                        <span className="mt-1 block h-2 rounded-full bg-foreground/10 overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${m.pct}%` }} /></span>
                        <span className="text-xs text-muted-foreground">{t('mem_regionLine', { n: m.dominated, total: m.total })}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="mt-3 text-sm text-foreground/75">{t('mem_how')}</p>
            <button onClick={() => { playButtonTap(); onTrain(); }} className="mt-4 w-full max-w-xl mx-auto block rounded-2xl border-2 border-primary/60 py-3 font-black text-lg text-primary hover:bg-primary/10">🎯 {t('mem_train')}</button>
          </>
        )}
      </div>
    </div>
  );
}

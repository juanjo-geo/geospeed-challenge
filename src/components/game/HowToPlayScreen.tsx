import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import AutoDemo from './AutoDemo';
import Wordmark from '@/components/ui/Wordmark';

interface HowToPlayScreenProps {
  onBack: () => void;
  onStartTraining: () => void;
}

/**
 * ¿Cómo jugar? (maqueta GeoSpeed_Como_Jugar_*_APROBADA_v1): tres pasos.
 * "Entendido" vuelve al origen; NO inicia una partida (regla HELP-01).
 * El Campo de tiro queda como acceso secundario para practicar sin vidas.
 */
export default function HowToPlayScreen({ onBack, onStartTraining }: HowToPlayScreenProps) {
  const { t } = useI18n();
  const steps = [
    { n: 1, emoji: '📖', title: t('home_step1'), desc: t('home_step1Desc'), mascot: '🧭' },
    { n: 2, emoji: '👆', title: t('home_step2'), desc: t('home_step2Desc'), mascot: '📍' },
    { n: 3, emoji: '⭐', title: t('home_step3'), desc: t('home_step3Desc'), mascot: '🎉' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg md:max-w-4xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => { playButtonTap(); onBack(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-border/60 bg-card/60 hover:bg-muted transition-all active:scale-[0.95]"
            aria-label={t('back')}
          >
            <span aria-hidden className="text-lg">‹</span>
          </button>
          <Wordmark size="sm" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-center leading-tight">{t('howto_title')}</h1>
        <p className="text-center font-bold mt-1 mb-4">
          <span className="text-accent">{t('home_equationSpeed')}</span>
          <span className="text-foreground"> + </span>
          <span className="text-accent">{t('home_equationPrecision')}</span>
          <span className="text-foreground"> = </span>
          <span className="text-primary">{t('home_equationPoints')}</span>
        </p>

        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
          <div className="rounded-3xl overflow-hidden border border-border mb-4 md:mb-0">
            <AutoDemo hideTagline />
          </div>

          <div className="flex flex-col gap-3">
            {steps.map(s => (
              <div key={s.n} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-card/70">
                <span className="w-9 h-9 rounded-full border-2 border-accent text-accent font-black flex items-center justify-center shrink-0">{s.n}</span>
                <span className="text-3xl shrink-0" aria-hidden>{s.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-black text-base sm:text-lg leading-tight">{s.title}</span>
                  <span className="block text-xs sm:text-sm text-muted-foreground">{s.desc}</span>
                </span>
                <span className="text-2xl shrink-0" aria-hidden>{s.mascot}</span>
              </div>
            ))}

            <button
              onClick={() => { playButtonTap(); onBack(); }}
              className="btn3d mt-2 w-full py-4 rounded-2xl font-black text-lg tracking-wide text-primary-foreground"
              style={{ background: 'var(--grad-cta)' }}
            >
              {t('howto_gotIt')} ›
            </button>
            <button
              onClick={() => { playButtonTap(); onStartTraining(); }}
              className="w-full py-3 rounded-2xl border-2 border-primary/50 text-primary font-black text-sm hover:bg-primary/10 transition-colors active:scale-[0.98]"
            >
              {t('home_training')}
            </button>
            <p className="text-center text-xs text-muted-foreground">{t('home_trainingDesc')}</p>
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}

import { lazy, Suspense } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ChevronIcon, HomeIcon } from '@/components/ui/icons';
import Mascot, { type MascotState } from './Mascot';
// La demo dibuja el mapa (polígonos): carga diferida, como en el Inicio
const AutoDemo = lazy(() => import('./AutoDemo'));

interface HowToPlayScreenProps {
  onBack: () => void;
  onStartTraining: () => void;
}

/**
 * ¿Cómo jugar? (maqueta GeoSpeed_Como_Jugar_*_APROBADA_v1): la demo del mapa y tres pasos, cada uno con
 * su número, ícono y el Explorador reaccionando. "Entendido" vuelve al origen; NO inicia una partida
 * (regla HELP-01). El Campo de tiro queda como acceso secundario para practicar sin vidas.
 */
export default function HowToPlayScreen({ onBack, onStartTraining }: HowToPlayScreenProps) {
  const { t } = useI18n();
  const steps: { n: number; icon: string; title: string; desc: string; mascot: MascotState; prop: string }[] = [
    { n: 1, icon: '📘', title: t('home_step1'), desc: t('home_step1Desc'), mascot: 'idle', prop: '📖' },
    { n: 2, icon: '👆', title: t('home_step2'), desc: t('home_step2Desc'), mascot: 'wink', prop: '📍' },
    { n: 3, icon: '⭐', title: t('home_step3'), desc: t('home_step3Desc'), mascot: 'celebrate', prop: '✨' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg md:max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('howto_title')} />
        <p className="-mt-2 sm:-mt-3 mb-4 text-center text-lg sm:text-2xl font-extrabold">
          <span className="text-accent">{t('home_equationSpeed')}</span>
          <span className="text-foreground"> + </span>
          <span className="text-accent">{t('home_equationPrecision')}</span>
          <span className="text-foreground"> = </span>
          <span className="text-primary">{t('home_equationPoints')}</span>
        </p>

        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
          <div className="rounded-3xl overflow-hidden border-2 border-accent/40 mb-4 md:mb-0 shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
            <Suspense fallback={<div className="w-full aspect-[360/128] bg-muted/20" />}>
              <AutoDemo hideTagline />
            </Suspense>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map(s => (
              <div key={s.n} className="flex items-center gap-3 px-3 py-2.5 sm:p-4 rounded-3xl border-2 border-accent/45 bg-card/75 shadow-[0_0_14px_hsl(var(--accent)/0.10)]">
                <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-accent bg-accent/15 text-foreground text-lg sm:text-xl font-extrabold flex items-center justify-center shrink-0 shadow-[0_0_10px_hsl(var(--accent)/0.5)]">{s.n}</span>
                <span className="text-4xl sm:text-5xl shrink-0" aria-hidden>{s.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold text-lg sm:text-2xl leading-tight">{s.title}</span>
                  <span className="block text-sm sm:text-base text-foreground/80 leading-snug">{s.desc}</span>
                </span>
                <span className="relative shrink-0 w-16 sm:w-20" aria-hidden>
                  <Mascot state={s.mascot} className="w-full" />
                  <span className="absolute -right-1 -bottom-1 text-2xl sm:text-3xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]">{s.prop}</span>
                </span>
              </div>
            ))}

            <button
              onClick={() => { playButtonTap(); onBack(); }}
              className="btn3d mt-1 w-full py-4 rounded-2xl font-black text-xl sm:text-2xl tracking-wide text-primary-foreground flex items-center justify-center gap-3"
              style={{ background: 'var(--grad-cta)' }}
            >
              {t('howto_gotIt')} <ChevronIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => { playButtonTap(); onStartTraining(); }}
              className="w-full py-3 rounded-2xl border-2 border-primary/60 text-primary font-black text-sm sm:text-base hover:bg-primary/10 transition-colors active:scale-[0.98]"
            >
              {t('home_training')}
            </button>
            <p className="text-center text-xs text-muted-foreground -mt-1">{t('home_trainingDesc')}</p>
            <button onClick={() => { playButtonTap(); onBack(); }} className="mx-auto flex items-center gap-2 text-accent font-semibold underline underline-offset-4 hover:text-foreground">
              <HomeIcon className="w-5 h-5" /> {t('ob_backHome')}
            </button>
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}

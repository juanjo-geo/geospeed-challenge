import { lazy, Suspense } from 'react';
import { useI18n } from '@/i18n';
import { useMemory, dueCount } from '@/lib/itemMemory';
import { playButtonTap } from '@/lib/sounds';
import { getPlayerLevel } from '@/lib/levelSystem';
import { getFlag } from '@/lib/featureFlags';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ChevronIcon, HomeIcon, LegendPin } from '@/components/ui/icons';
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface MoreModesScreenProps {
  onBack: () => void;
  onTimeAttack: () => void;
  onSpeedDemon: () => void;
  onWorldChallenge: () => void;
  /** Fase 4: entrenamiento (configuración) y Tu memoria */
  onTraining?: () => void;
  onMemory?: () => void;
  /** Fase 5: Sprint */
  onSprint?: () => void;
}

const IMPOSSIBLE_UNLOCK_LEVEL = 5;

/**
 * Más modos (maqueta GeoSpeed_Mas_Modos_APROBADA_v1): 60 segundos de caos · Imposible · Desafío Mundial.
 * Tarjetas grandes con ilustración a la izquierda, etiqueta y flecha; cada una lleva a las reglas/selección
 * que ya tiene cada modo.
 */
export default function MoreModesScreen({ onBack, onTimeAttack, onSpeedDemon, onWorldChallenge, onTraining, onMemory, onSprint }: MoreModesScreenProps) {
  const { t } = useI18n();
  const level = getPlayerLevel().level;
  const impossibleLocked = level < IMPOSSIBLE_UNLOCK_LEVEL;
  const wcEvent = Boolean(getFlag('world_challenge_event'));
  const due = dueCount(useMemory());

  const cards = [
    ...(onSprint ? [{
      key: 'sprint', art: ['⚡', '🏆'], title: 'Sprint', desc: t('more_sprintDesc'), tag: t('more_sprintTag'),
      ring: 'border-primary/70 shadow-[0_0_18px_hsl(var(--primary)/0.2)]', tagClass: 'border-primary text-primary',
      onClick: onSprint, locked: false,
    }] : []),
    {
      key: 'caos', art: ['⚡', '⏱️'], title: t('ta_title'), desc: t('more_caosDesc'), tag: '60 s',
      ring: 'border-accent/70 shadow-[0_0_18px_hsl(var(--accent)/0.18)]', tagClass: 'border-primary text-primary',
      onClick: onTimeAttack, locked: false,
    },
    {
      key: 'impossible', art: ['🔥', '⏱️'], title: t('home_speedDemon'), desc: t('home_speedDemonDesc'), tag: t('more_impossibleTag'),
      ring: 'border-destructive/70 shadow-[0_0_18px_hsl(var(--destructive)/0.15)]', tagClass: 'border-destructive text-destructive',
      onClick: onSpeedDemon, locked: impossibleLocked,
    },
    {
      key: 'mundial', art: ['⚽', '🌍'], title: t('wc_modeName'), desc: t('wc_homeDesc'), tag: wcEvent ? t('wc_eventLive') : t('more_mundialTag'),
      ring: 'border-primary/70 shadow-[0_0_18px_hsl(var(--primary)/0.15)]', tagClass: wcEvent ? 'border-destructive text-destructive animate-pulse' : 'border-primary text-primary',
      onClick: onWorldChallenge, locked: false,
    },
    ...(onTraining ? [{
      key: 'training', art: ['🎯', '🗺️'], title: t('train_title'), desc: t('more_trainingDesc'), tag: t('more_trainingTag'),
      ring: 'border-accent/70 shadow-[0_0_18px_hsl(var(--accent)/0.18)]', tagClass: 'border-accent text-accent',
      onClick: onTraining, locked: false,
    }] : []),
    ...(onMemory ? [{
      key: 'memory', art: ['🧠', '🗓️'], title: t('mem_title'), desc: t('more_memoryDesc'), tag: due > 0 ? t('more_memoryDue', { n: due }) : t('more_memoryTag'),
      ring: 'border-primary/70 shadow-[0_0_18px_hsl(var(--primary)/0.15)]', tagClass: due > 0 ? 'border-accent text-accent' : 'border-primary text-primary',
      onClick: onMemory, locked: false,
    }] : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg md:max-w-4xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={t('more_title')}
          subtitle={t('more_subtitle')}
          align="left"
          titleAside={
            <div className="relative w-24 sm:w-28 shrink-0 mt-3 short:hidden" aria-hidden>
              <div className="rounded-full shadow-[0_0_24px_hsl(var(--accent)/0.4)]"><Suspense fallback={<div className="w-full aspect-square rounded-full bg-accent/20" />}><SplashGlobe /></Suspense></div>
              <LegendPin color="hsl(var(--primary))" className="absolute -top-2 left-1/3 w-7 h-7" />
              <LegendPin color="hsl(var(--accent))" className="absolute bottom-1 -left-2 w-6 h-6" />
              <LegendPin color="hsl(var(--destructive))" className="absolute top-1/3 -right-2 w-6 h-6" />
            </div>
          }
        />

        <div className="flex flex-col md:grid md:grid-cols-3 gap-3 sm:gap-4">
          {cards.map(c => (
            <button
              key={c.key}
              disabled={c.locked}
              onClick={() => { if (!c.locked) { playButtonTap(); c.onClick(); } }}
              className={`relative flex md:flex-col items-center md:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-3xl border-2 bg-card/75 text-left transition-all active:scale-[0.98] hover:brightness-110 ${c.ring} ${c.locked ? 'opacity-55 cursor-not-allowed' : ''}`}
            >
              {/* Ilustración compuesta: emoji grande con otro delante */}
              <span className={`relative w-28 h-24 sm:w-32 sm:h-28 shrink-0 flex items-center justify-center ${c.locked ? 'grayscale' : ''}`} aria-hidden>
                <span className="absolute inset-2 rounded-full bg-accent/10 blur-md" />
                <span className="relative text-6xl sm:text-7xl leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] -translate-x-3">{c.art[0]}</span>
                <span className="absolute right-1 bottom-2 text-4xl sm:text-5xl leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">{c.art[1]}</span>
                {c.locked && <span className="absolute top-0 right-0 text-2xl">🔒</span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xl sm:text-2xl font-extrabold leading-tight">{c.title}</span>
                <span className="block text-sm sm:text-base text-foreground/80 mt-1 leading-snug">
                  {c.locked ? t('lock_level', { level: IMPOSSIBLE_UNLOCK_LEVEL }) : c.desc}
                </span>
                <span className={`inline-block mt-2.5 px-4 py-1 rounded-full border-2 text-xs sm:text-sm font-bold ${c.tagClass}`}>{c.tag}</span>
              </span>
              <ChevronIcon className="w-7 h-7 text-foreground/85 md:absolute md:right-4 md:top-4" />
            </button>
          ))}
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground/80">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></svg>
          {t('more_note')}
        </p>

        <button
          onClick={() => { playButtonTap(); onBack(); }}
          className="mt-4 w-full max-w-xl mx-auto py-3.5 rounded-2xl border-2 border-foreground/30 bg-background/30 font-bold text-base hover:bg-muted/50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          <HomeIcon className="w-6 h-6" /> {t('more_back')}
        </button>
        <div className="h-6" />
      </div>
    </div>
  );
}

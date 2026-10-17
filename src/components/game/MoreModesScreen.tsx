import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { getPlayerLevel } from '@/lib/levelSystem';
import { getFlag } from '@/lib/featureFlags';
import Wordmark from '@/components/ui/Wordmark';

interface MoreModesScreenProps {
  onBack: () => void;
  onTimeAttack: () => void;
  onSpeedDemon: () => void;
  onWorldChallenge: () => void;
}

const IMPOSSIBLE_UNLOCK_LEVEL = 5;

/**
 * Más modos (maqueta GeoSpeed_Mas_Modos_APROBADA_v1): 60 segundos de caos · Imposible · Desafío Mundial.
 * Cada tarjeta lleva a la pantalla de reglas/selección que ya tiene cada modo.
 */
export default function MoreModesScreen({ onBack, onTimeAttack, onSpeedDemon, onWorldChallenge }: MoreModesScreenProps) {
  const { t } = useI18n();
  const level = getPlayerLevel().level;
  const impossibleLocked = level < IMPOSSIBLE_UNLOCK_LEVEL;
  const wcEvent = Boolean(getFlag('world_challenge_event'));

  const cards = [
    {
      key: 'caos', emoji: '⚡', title: t('ta_title'), desc: t('more_caosDesc'), tag: '60 s',
      ring: 'border-accent/60 hover:border-accent', tagClass: 'border-primary/60 text-primary',
      onClick: onTimeAttack, locked: false,
    },
    {
      key: 'impossible', emoji: '🔥', title: t('home_speedDemon'), desc: t('home_speedDemonDesc'), tag: t('more_impossibleTag'),
      ring: 'border-destructive/50 hover:border-destructive', tagClass: 'border-destructive/60 text-destructive',
      onClick: onSpeedDemon, locked: impossibleLocked,
    },
    {
      key: 'mundial', emoji: '⚽', title: t('wc_modeName'), desc: t('wc_homeDesc'), tag: wcEvent ? t('wc_eventLive') : t('more_mundialTag'),
      ring: 'border-primary/60 hover:border-primary', tagClass: wcEvent ? 'border-destructive text-destructive animate-pulse' : 'border-primary/60 text-primary',
      onClick: onWorldChallenge, locked: false,
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg md:max-w-3xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { playButtonTap(); onBack(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-border/60 bg-card/60 hover:bg-muted transition-all active:scale-[0.95]"
            aria-label={t('back')}
          >
            <span aria-hidden className="text-lg">‹</span>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <Wordmark size="sm" />
          </div>
          <span className="w-10" aria-hidden />
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black leading-none">{t('more_title')}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{t('more_subtitle')}</p>
          </div>
          <span className="text-5xl sm:text-6xl" aria-hidden>🌍</span>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-3">
          {cards.map(c => (
            <button
              key={c.key}
              disabled={c.locked}
              onClick={() => { if (!c.locked) { playButtonTap(); c.onClick(); } }}
              className={`relative flex md:flex-col items-center md:items-start gap-4 p-4 sm:p-5 rounded-3xl border-2 bg-card/70 text-left transition-all active:scale-[0.98] ${c.ring} ${c.locked ? 'opacity-55 cursor-not-allowed' : ''}`}
            >
              <span className="text-5xl md:text-6xl shrink-0" aria-hidden>{c.locked ? '🔒' : c.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg sm:text-xl font-black leading-tight">{c.title}</span>
                <span className="block text-xs sm:text-sm text-muted-foreground mt-1">
                  {c.locked ? t('lock_level', { level: IMPOSSIBLE_UNLOCK_LEVEL }) : c.desc}
                </span>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full border text-[11px] font-bold ${c.tagClass}`}>{c.tag}</span>
              </span>
              <span className="text-muted-foreground md:absolute md:right-4 md:top-4" aria-hidden>›</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">ⓘ {t('more_note')}</p>

        <button
          onClick={() => { playButtonTap(); onBack(); }}
          className="mt-4 w-full py-3 rounded-2xl border border-border bg-card/40 font-bold text-sm hover:bg-muted transition-colors active:scale-[0.98]"
        >
          🏠 {t('more_back')}
        </button>
        <div className="h-6" />
      </div>
    </div>
  );
}

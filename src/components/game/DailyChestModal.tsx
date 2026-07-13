import { useState, useRef } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playLevelUp } from '@/lib/sounds';
import { fireGoldBurst, fireCelebration } from '@/lib/confetti';
import type { StreakReward } from '@/lib/dailyStreak';

interface DailyChestModalProps {
  reward: StreakReward;
  /** Se llama al ABRIR el cofre (aplica el premio de inmediato). */
  onOpen: () => void;
  /** Se llama al pulsar "Reclamar" (cierra el modal). */
  onClose: () => void;
}

/**
 * Cofre diario de login — recompensa variable con anticipación (Capa 4 juice).
 * Flujo: el cofre tiembla invitando a tocar → tap → estallido de luz + confeti
 * dorado → se revela el premio → botón Reclamar. El premio se aplica al abrir
 * (idempotente por día vía claimDailyReward), así un tap ya garantiza las vidas.
 */
export default function DailyChestModal({ reward, onOpen, onClose }: DailyChestModalProps) {
  const { t } = useI18n();
  const [opened, setOpened] = useState(false);
  const chestRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    onOpen();
    playLevelUp();
    const rect = chestRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : undefined;
    fireGoldBurst(origin);
    setTimeout(() => fireCelebration(origin), 260);
    if (navigator.vibrate) { try { navigator.vibrate([12, 40, 24]); } catch { /* no-op */ } }
  };

  const dayLabel = reward.day === 1
    ? t('home_streakDaysSingular', { count: String(reward.day) })
    : t('home_streakDaysPlural', { count: String(reward.day) });

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t('chest_daily')}
    >
      <style>{`
        @keyframes dc-wiggle { 0%,100%{transform:rotate(0deg) translateY(0)} 12%{transform:rotate(-5deg)} 26%{transform:rotate(5deg) translateY(-5px)} 40%{transform:rotate(-4deg)} 55%{transform:rotate(4deg) translateY(-3px)} 70%{transform:rotate(-2deg)} 85%{transform:rotate(1deg)} }
        @keyframes dc-rays { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dc-pop { 0%{transform:scale(.35);opacity:0} 55%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
        .dc-wiggle{ animation: dc-wiggle 1.5s ease-in-out infinite; transform-origin:center bottom; }
        .dc-rays{ animation: dc-rays 9s linear infinite; }
        .dc-pop{ animation: dc-pop .55s cubic-bezier(.2,1.5,.4,1) both; }
      `}</style>

      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary/80 mb-1">{t('chest_daily')}</p>
      <p className="text-base sm:text-lg font-black text-foreground mb-6">🔥 {dayLabel}</p>

      <div className="relative flex items-center justify-center mb-7" style={{ width: 220, height: 220 }}>
        {opened && (
          <div
            className="dc-rays absolute"
            style={{
              width: 320,
              height: 320,
              background: 'repeating-conic-gradient(rgba(245,200,66,0.30) 0deg 10deg, transparent 10deg 28deg)',
              WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
              maskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
            }}
          />
        )}

        {!opened ? (
          <button
            ref={chestRef}
            onClick={handleOpen}
            className="dc-wiggle relative z-10 select-none"
            aria-label={t('chest_tapToOpen')}
          >
            <span style={{ fontSize: 128, filter: 'drop-shadow(0 10px 26px rgba(245,200,66,0.55))' }}>🎁</span>
          </button>
        ) : (
          <div className="dc-pop relative z-10 flex flex-col items-center text-center">
            {reward.lives > 0 && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 68, filter: 'drop-shadow(0 6px 16px rgba(245,200,66,0.5))' }}>❤️</span>
                <span className="text-5xl sm:text-6xl font-black" style={{ color: 'hsl(var(--primary))' }}>+{reward.lives}</span>
              </div>
            )}
            <p className="mt-2 text-sm sm:text-base font-bold text-foreground">
              {reward.lives === 1
                ? t('home_streakBonusLives', { lives: String(reward.lives) })
                : t('home_streakBonusLivesPlural', { lives: String(reward.lives) })}
            </p>
            {reward.badge && (
              <p className="mt-1 text-xs sm:text-sm font-bold text-amber-400">🏅 {reward.badge}</p>
            )}
          </div>
        )}
      </div>

      {!opened ? (
        <p className="text-sm text-muted-foreground animate-pulse">{t('chest_tapToOpen')}</p>
      ) : (
        <button
          onClick={() => { playButtonTap(); onClose(); }}
          className="px-8 py-3 rounded-xl font-black text-base transition-all active:scale-[0.97] animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(44 91% 50%))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 6px 0 rgba(150,108,20,0.95)',
          }}
        >
          {t('chest_claim')}
        </button>
      )}
    </div>
  );
}

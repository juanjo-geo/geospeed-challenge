import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';

const TUTORIAL_KEY = 'geospeed_tutorial_seen';

interface TutorialOverlayProps {
  onComplete: () => void;
}

/**
 * Ghost-hand tutorial — minimal overlay on top of the real game.
 * Shows an animated pointing hand + one-line instruction.
 * Se cierra solo cuando el jugador toca (HELP-01: la ayuda no arranca la partida por su cuenta).
 */
export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      setVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none animate-fade-in"
      onClick={dismiss}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Semi-transparent backdrop — very subtle */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Ghost hand + instruction */}
      <div className="relative flex flex-col items-center gap-3 animate-fade-in-up">
        {/* Animated hand */}
        <div
          className="text-5xl sm:text-6xl"
          style={{
            animation: 'ghost-hand-bounce 1.5s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          }}
        >
          👆
        </div>

        {/* Instruction text */}
        <div
          className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-xl px-5 py-3 text-center shadow-2xl max-w-[280px] sm:max-w-[320px]"
        >
          <p className="text-sm sm:text-base font-bold text-foreground mb-1">
            {t('tutorial_ghostTitle') || 'Toca el mapa'}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            {t('tutorial_ghostDesc') || 'Indica dónde crees que está la ciudad. Más cerca = más puntos.'}
          </p>
        </div>

        {/* Tap to dismiss hint */}
        <p className="text-[10px] text-white/60 animate-pulse mt-1">
          {t('tutorial_ghostDismiss') || 'Toca para continuar'}
        </p>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes ghost-hand-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

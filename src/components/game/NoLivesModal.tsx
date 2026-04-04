import { useState, useEffect } from 'react';
import { getEnergy, formatRegenTime } from '@/lib/energySystem';

interface NoLivesModalProps {
  onClose: () => void;
}

export default function NoLivesModal({ onClose }: NoLivesModalProps) {
  const [energy, setEnergy] = useState(getEnergy());

  useEffect(() => {
    const interval = setInterval(() => {
      const e = getEnergy();
      setEnergy(e);
      if (e.lives > 0) onClose();
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-3">
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
        <span className="text-4xl sm:text-5xl block mb-3 sm:mb-4">💔</span>
        <h2 className="text-lg sm:text-xl font-black mb-1.5 sm:mb-2" style={{ color: 'hsl(var(--primary))' }}>
          ¡Sin vidas!
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">
          Tus vidas se regeneran con el tiempo. La próxima vida llega en:
        </p>
        <div
          className="text-2xl sm:text-3xl font-mono font-black mb-4 sm:mb-6"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {formatRegenTime(energy.nextRegenMs)}
        </div>
        <div className="flex gap-0.5 justify-center mb-4 sm:mb-6">
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span key={i} className="text-xl sm:text-2xl" style={{ opacity: i < energy.lives ? 1 : 0.15, filter: i < energy.lives ? 'none' : 'grayscale(1)' }}>
              ❤️
            </span>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground hover:bg-muted transition-all active:scale-[0.97]"
        >
          VOLVER AL MENÚ
        </button>
      </div>
    </div>
  );
}
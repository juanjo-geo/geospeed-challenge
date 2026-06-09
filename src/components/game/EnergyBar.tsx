import { useState, useEffect } from 'react';
import { getEnergy, formatRegenTime } from '@/lib/energySystem';
import { useI18n } from '@/i18n';

export default function EnergyBar() {
  const { t } = useI18n();
  const [energy, setEnergy] = useState(getEnergy());

  useEffect(() => {
    const interval = setInterval(() => setEnergy(getEnergy()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Si el total supera el tope de regeneración (5), mostrar "❤️ ×N" (no caben N corazones).
  const showCompact = energy.lives > energy.maxLives;

  return (
    <div className="flex items-center gap-1.5">
      {showCompact ? (
        <span className="flex items-center gap-0.5 text-base font-bold">
          ❤️ <span className="font-mono text-sm">×{energy.lives}</span>
        </span>
      ) : (
        <div className="flex gap-0.5">
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span
              key={i}
              className="text-base transition-all duration-300"
              style={{
                opacity: i < energy.lives ? 1 : 0.2,
                transform: i < energy.lives ? 'scale(1)' : 'scale(0.8)',
                filter: i < energy.lives ? 'none' : 'grayscale(1)',
              }}
            >
              ❤️
            </span>
          ))}
        </div>
      )}
      {energy.lives < energy.maxLives && (
        <span className="text-[10px] font-mono text-muted-foreground ml-1">
          {t('energy_nextRegenIn', { time: formatRegenTime(energy.nextRegenMs) })}
        </span>
      )}
    </div>
  );
}

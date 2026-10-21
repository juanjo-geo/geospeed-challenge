import { useState, useEffect } from 'react';
import { getEnergy, formatRegenTime } from '@/lib/energySystem';
import { useI18n } from '@/i18n';

/**
 * @param stacked el tiempo para la próxima vida va debajo de los corazones (encabezados estrechos)
 * @param chip    ficha "❤️ 5" como la de la racha, en vez de 5 corazones (encabezado del celular angosto)
 */
export default function EnergyBar({ stacked = false, chip = false }: { stacked?: boolean; chip?: boolean } = {}) {
  const { t } = useI18n();
  const [energy, setEnergy] = useState(getEnergy());

  useEffect(() => {
    const interval = setInterval(() => setEnergy(getEnergy()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Si el total supera el tope de regeneración (5), mostrar "❤️ ×N" (no caben N corazones).
  const showCompact = energy.lives > energy.maxLives;

  if (chip) {
    return (
      <div className="flex flex-col items-center" aria-label={t('energy_livesAria', { n: energy.lives })}>
        <span className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-sm font-extrabold ${energy.lives > 0 ? 'border-destructive/50 text-foreground' : 'border-foreground/20 text-foreground/60'}`}>
          <span className={energy.lives > 0 ? '' : 'grayscale opacity-60'} aria-hidden>❤️</span>{energy.lives}
        </span>
        {energy.lives < energy.maxLives && (
          <span className="text-[9px] font-mono text-muted-foreground leading-none mt-0.5 whitespace-nowrap">{formatRegenTime(energy.nextRegenMs)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex relative ${stacked ? 'flex-col items-start gap-0' : 'items-center gap-1.5'}`}>
      {showCompact ? (
        <span className="flex items-center gap-0.5 text-base font-bold">
          ❤️ <span className="font-mono text-sm">×{energy.lives}</span>
        </span>
      ) : (
        <div className="flex gap-0.5">
          {Array.from({ length: energy.maxLives }).map((_, i) => (
            <span
              key={i}
              className={`${stacked ? 'text-sm' : 'text-base'} transition-all duration-300`}
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
        <span className={`text-[10px] font-mono text-muted-foreground ${stacked ? 'leading-none mt-0.5' : 'ml-1'}`}>
          {t('energy_nextRegenIn', { time: formatRegenTime(energy.nextRegenMs) })}
        </span>
      )}
    </div>
  );
}

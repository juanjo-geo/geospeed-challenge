import { useState, useEffect } from 'react';
import { getEnergy, formatRegenTime } from '@/lib/energySystem';

export default function EnergyBar() {
  const [energy, setEnergy] = useState(getEnergy());

  useEffect(() => {
    const interval = setInterval(() => setEnergy(getEnergy()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
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
      {energy.lives < energy.maxLives && (
        <span className="text-[10px] font-mono text-muted-foreground ml-1">
          +1 en {formatRegenTime(energy.nextRegenMs)}
        </span>
      )}
    </div>
  );
}

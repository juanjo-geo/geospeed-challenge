import { useState, useEffect, useRef } from 'react';
import { getEnergy, formatRegenTime, addLives, drainLives } from '@/lib/energySystem';
import { resetPro } from '@/lib/premiumSystem';
import { useI18n } from '@/i18n';

export default function EnergyBar() {
  const { t } = useI18n();
  const [energy, setEnergy] = useState(getEnergy());
  const [refillFlash, setRefillFlash] = useState(false);
  const tapRef = useRef({ count: 0, last: 0 });
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drainFlash, setDrainFlash] = useState(false);
  // Gesto secreto de PRUEBA: mantener presionado ~1s → vacía vidas + quita Pro (para probar el modal "sin vidas").
  const startHold = () => {
    holdRef.current = setTimeout(() => {
      drainLives();
      resetPro();
      setEnergy(getEnergy());
      setDrainFlash(true);
      setTimeout(() => setDrainFlash(false), 1600);
    }, 1000);
  };
  const cancelHold = () => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } };
  // Gesto secreto de PRUEBA: 5 toques rápidos en el medidor → +20 vidas (funciona en la app instalada).
  const handleSecretTap = () => {
    const now = Date.now();
    const st = tapRef.current;
    if (now - st.last > 1200) st.count = 0;
    st.last = now;
    st.count += 1;
    if (st.count >= 5) {
      st.count = 0;
      addLives(20);
      setEnergy(getEnergy());
      setRefillFlash(true);
      setTimeout(() => setRefillFlash(false), 1500);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setEnergy(getEnergy()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Si el total supera el tope de regeneración (5), mostrar "❤️ ×N" (no caben N corazones).
  const showCompact = energy.lives > energy.maxLives;

  return (
    <div className="flex items-center gap-1.5 relative" onClick={handleSecretTap} onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold}>
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
      {refillFlash && <span className="absolute -top-4 left-0 text-[10px] font-bold text-emerald-400 animate-fade-in">+20 ❤️</span>}
      {drainFlash && <span className="absolute -top-4 left-0 whitespace-nowrap text-[10px] font-bold text-red-400 animate-fade-in">0 ❤️ · sin Pro</span>}
    </div>
  );
}

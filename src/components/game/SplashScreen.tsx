import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 transition-all duration-700 ease-out game-bg"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Glowing ring */}
      <div
        className="relative mb-4 sm:mb-6 transition-all duration-1000 ease-out"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.7)' : 'scale(1)',
        }}
      >
        <div
          className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, hsla(var(--primary), 0.15) 0%, transparent 70%)',
            boxShadow: '0 0 60px hsla(var(--primary), 0.2), 0 0 120px hsla(var(--primary), 0.1)',
          }}
        >
          <span className="text-4xl sm:text-6xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 12px hsla(var(--primary), 0.4))' }}>📍</span>
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight transition-all duration-1000 ease-out delay-200"
        style={{
          fontFamily: 'Impact, system-ui',
          color: 'hsl(var(--primary))',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(20px)' : 'translateY(0)',
          textShadow: '0 0 40px hsla(var(--primary), 0.3)',
        }}
      >
        GEOSPEED
      </h1>
      <p
        className="text-xs sm:text-sm md:text-base tracking-[0.3em] uppercase mt-1.5 sm:mt-2 transition-all duration-1000 ease-out delay-500"
        style={{
          color: 'hsl(var(--muted-foreground))',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(12px)' : 'translateY(0)',
        }}
      >
        IQ Challenge
      </p>

      {/* Loading bar */}
      <div className="mt-8 sm:mt-10 w-32 sm:w-40 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            background: 'hsl(var(--primary))',
            width: phase === 'enter' ? '0%' : phase === 'hold' ? '85%' : '100%',
            transitionDuration: phase === 'hold' ? '2000ms' : '600ms',
          }}
        />
      </div>
    </div>
  );
}
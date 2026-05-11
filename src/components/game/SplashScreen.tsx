import { useState, useEffect, useCallback } from 'react';
import { unlockAudio } from '@/lib/sounds';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  // Tap anywhere on splash to unlock audio early (enables music autoplay)
  const handleTap = useCallback(() => {
    if (!tapped) {
      setTapped(true);
      unlockAudio();
    }
  }, [tapped]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 transition-all duration-700 ease-out game-bg cursor-pointer"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.05)' : 'scale(1)',
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Logo image with glow */}
      <div
        className="relative mb-px sm:mb-0.5 transition-all duration-1000 ease-out"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6) rotate(-10deg)' : 'scale(1) rotate(0deg)',
        }}
      >
        <img
          src="/logo.png"
          alt="GeoSpeed Logo"
          className="w-[72px] h-[72px] sm:w-[108px] sm:h-[108px] md:w-[132px] md:h-[132px] object-contain"
          style={{
            filter: 'none',
          }}
        />
      </div>

      {/* Title — gold gradient text */}
      <h1
        className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight transition-all duration-1000 ease-out delay-200"
        style={{
          fontFamily: 'Impact, system-ui',
          background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(20px)' : 'translateY(0)',
          filter: 'drop-shadow(0 2px 8px rgba(240,160,48,0.4))',
        }}
      >
        GEOSPEED
      </h1>

      {/* Loading bar — gold to teal */}
      <div className="mt-6 sm:mt-8 w-32 sm:w-40 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(240,160,48,0.15)' }}>
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            background: 'linear-gradient(90deg, #D48020, #F0A030, #00D4AA)',
            width: phase === 'enter' ? '0%' : phase === 'hold' ? '85%' : '100%',
            transitionDuration: phase === 'hold' ? '2000ms' : '600ms',
            boxShadow: '0 0 8px rgba(240,160,48,0.4)',
          }}
        />
      </div>

      {/* Tagline */}
      <p
        className="mt-3 text-[10px] sm:text-xs tracking-widest uppercase transition-all duration-1000 ease-out delay-700"
        style={{
          color: '#00D4AA',
          opacity: phase === 'enter' ? 0 : 0.5,
          transform: phase === 'enter' ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        ¿Cuánto conoces el mundo?
      </p>

      {/* Tap hint */}
      {!tapped && phase === 'hold' && (
        <p
          className="absolute bottom-8 text-[10px] tracking-widest uppercase animate-pulse"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          TAP TO START
        </p>
      )}
    </div>
  );
}

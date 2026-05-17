import { useState, useEffect } from 'react';

/** Detect ultra-wide screens (21:9+) and provide max-width constraints */
export function useUltraWide(): { isUltraWide: boolean; maxMapWidth: string } {
  const [isUltraWide, setIsUltraWide] = useState(false);

  useEffect(() => {
    const check = () => {
      const ratio = window.innerWidth / window.innerHeight;
      setIsUltraWide(ratio > 2.2); // 21:9 = 2.33
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return {
    isUltraWide,
    maxMapWidth: isUltraWide ? 'calc(100vh * 2.1)' : '100%', // Clamp to ~21:9 max
  };
}

import { useEffect } from 'react';

export type Theme = 'neon';

// Force neon theme on app load — no toggle needed
function applyNeon(): void {
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('neon');
}

// Apply immediately on module load (before any component mounts)
applyNeon();

export function useTheme() {
  useEffect(() => { applyNeon(); }, []);
  return { theme: 'neon' as const, toggleTheme: () => {} };
}

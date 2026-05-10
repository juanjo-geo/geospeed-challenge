import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'neon';

const STORAGE_KEY = 'geospeed_theme';
const ALL_THEME_CLASSES = ['light', 'neon'] as const;

function applyTheme(theme: Theme): void {
  // Remove all theme classes first
  ALL_THEME_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
  // Apply the new theme class (dark = no class, light/neon = add class)
  if (theme !== 'dark') {
    document.documentElement.classList.add(theme);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
      return 'neon';
    } catch {
      return 'neon';
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => {
    if (t === 'neon') return 'dark';
    if (t === 'dark') return 'light';
    return 'neon'; // light → neon
  });

  return { theme, toggleTheme };
}

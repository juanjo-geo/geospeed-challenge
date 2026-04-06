import { useState, useEffect, useCallback } from 'react';

/**
 * Colorblind-safe palette
 * Uses Blue/Orange/Yellow/Magenta instead of Green/Red/Yellow/Orange
 * Distinguishable by all major types: protanopia, deuteranopia, tritanopia
 */
const CB_PALETTE = {
  // Replaces green (good/success)
  good:   { tw: 'text-sky-400',    twBg: 'bg-sky-500',    twBgSoft: 'bg-sky-500/20',    twBorder: 'border-sky-500/30',  hex: '#38bdf8' },
  // Replaces emerald (pretty good)
  fair:   { tw: 'text-cyan-400',   twBg: 'bg-cyan-500',   twBgSoft: 'bg-cyan-500/20',   twBorder: 'border-cyan-500/30', hex: '#22d3ee' },
  // Replaces yellow (medium)
  medium: { tw: 'text-amber-300',  twBg: 'bg-amber-400',  twBgSoft: 'bg-amber-400/20',  twBorder: 'border-amber-400/30', hex: '#fcd34d' },
  // Replaces orange (warning)
  warn:   { tw: 'text-orange-400', twBg: 'bg-orange-500',  twBgSoft: 'bg-orange-500/20', twBorder: 'border-orange-500/30', hex: '#fb923c' },
  // Replaces red (bad/danger)
  bad:    { tw: 'text-fuchsia-400', twBg: 'bg-fuchsia-500', twBgSoft: 'bg-fuchsia-500/20', twBorder: 'border-fuchsia-500/30', hex: '#e879f9' },
} as const;

const NORMAL_PALETTE = {
  good:   { tw: 'text-green-400',   twBg: 'bg-green-500',   twBgSoft: 'bg-green-500/20',   twBorder: 'border-green-500/30',  hex: '#4ade80' },
  fair:   { tw: 'text-emerald-400', twBg: 'bg-emerald-500', twBgSoft: 'bg-emerald-500/20', twBorder: 'border-emerald-500/30', hex: '#34d399' },
  medium: { tw: 'text-yellow-400',  twBg: 'bg-yellow-400',  twBgSoft: 'bg-yellow-500/15',  twBorder: 'border-yellow-500/30',  hex: '#facc15' },
  warn:   { tw: 'text-orange-400',  twBg: 'bg-orange-500',  twBgSoft: 'bg-orange-500/20',  twBorder: 'border-orange-500/30',  hex: '#fb923c' },
  bad:    { tw: 'text-red-400',     twBg: 'bg-red-500',     twBgSoft: 'bg-red-500/20',     twBorder: 'border-red-500/30',     hex: '#f87171' },
} as const;

export type ColorKey = keyof typeof CB_PALETTE;

const STORAGE_KEY = 'geospeed_colorblind';

export function useAccessibility() {
  const [colorblind, setColorblind] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(colorblind)); } catch {}
    // Add class to html for CSS-level overrides if needed
    document.documentElement.classList.toggle('colorblind', colorblind);
  }, [colorblind]);

  const toggleColorblind = useCallback(() => setColorblind(v => !v), []);

  const palette = colorblind ? CB_PALETTE : NORMAL_PALETTE;

  return { colorblind, toggleColorblind, palette };
}

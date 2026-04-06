import { createContext, useContext, ReactNode } from 'react';
import { useAccessibility, type ColorKey } from '@/hooks/useAccessibility';

type Palette = ReturnType<typeof useAccessibility>['palette'];

interface AccessibilityCtx {
  colorblind: boolean;
  toggleColorblind: () => void;
  palette: Palette;
}

const Ctx = createContext<AccessibilityCtx | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const value = useAccessibility();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useA11y() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useA11y must be inside AccessibilityProvider');
  return ctx;
}

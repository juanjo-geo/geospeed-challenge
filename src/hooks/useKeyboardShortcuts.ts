import { useEffect } from 'react';

type ShortcutMap = Record<string, () => void>;

/**
 * Global keyboard shortcuts hook.
 * Maps key names (e.g. 'Enter', 'Escape', 'Space') to callback functions.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key === ' ' ? 'Space' : e.key;
      const fn = shortcuts[key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}

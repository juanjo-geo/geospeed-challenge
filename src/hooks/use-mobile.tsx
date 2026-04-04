import * as React from "react";

// =============================================================================
// GAME LAYOUT SYSTEM — 3 clear breakpoints
// =============================================================================
//
// COMPACT:  width < 640  OR  portrait on any touch device
//           → Map fullscreen + floating HUD overlay
//
// MEDIUM:   640–1024 width (landscape)
//           → Map + slim left sidebar (game info)
//
// WIDE:     > 1024 width (landscape)
//           → Left sidebar + Map + Right result panel
//
// =============================================================================

export type GameLayoutMode = 'compact' | 'medium' | 'wide';

const COMPACT_MAX_WIDTH = 640;
const WIDE_MIN_WIDTH = 1025;

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

function detectGameLayoutMode(): GameLayoutMode {
  if (typeof window === "undefined") return 'compact';

  const w = window.innerWidth;
  const h = window.innerHeight;
  const isPortrait = h > w;
  const isTouch = isTouchDevice();

  // Portrait on touch devices → always compact (map needs max vertical space)
  if (isPortrait && isTouch) return 'compact';

  // Narrow viewport → compact
  if (w < COMPACT_MAX_WIDTH) return 'compact';

  // Wide viewport → full 3-column layout
  if (w >= WIDE_MIN_WIDTH) return 'wide';

  // Everything in between → medium (map + slim sidebar)
  return 'medium';
}

function detectIsLandscape(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth > window.innerHeight;
}

function detectIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  const isTouch = isTouchDevice();
  return w < 768 || (isTouch && w <= 1024);
}

// =============================================================================
// Hooks
// =============================================================================

/** Primary hook: returns 'compact' | 'medium' | 'wide' */
export function useGameLayoutMode(): GameLayoutMode {
  const [mode, setMode] = React.useState<GameLayoutMode>(() => detectGameLayoutMode());

  React.useEffect(() => {
    const onChange = () => setMode(detectGameLayoutMode());

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", () => setTimeout(onChange, 100));

    // Also listen to matchMedia for more reliable detection
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    portraitQuery.addEventListener("change", onChange);

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      portraitQuery.removeEventListener("change", onChange);
    };
  }, []);

  return mode;
}

/** Landscape detection */
export function useIsLandscapeViewport(): boolean {
  const [isLandscape, setIsLandscape] = React.useState(() => detectIsLandscape());

  React.useEffect(() => {
    const onChange = () => setIsLandscape(detectIsLandscape());

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", () => setTimeout(onChange, 100));

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return isLandscape;
}

// =============================================================================
// Legacy-compatible hooks (used by Index.tsx, sidebar.tsx)
// =============================================================================

/** Used by Index.tsx for rotate-screen prompt and sidebar.tsx */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => detectIsMobile());

  React.useEffect(() => {
    const onChange = () => setIsMobile(detectIsMobile());

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", () => setTimeout(onChange, 100));

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return isMobile;
}

/** Returns true when on a touch device in portrait orientation */
export function useIsPortraitMobile(): boolean {
  const [isPortraitMobile, setIsPortraitMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return isTouchDevice() && window.innerHeight > window.innerWidth;
  });

  React.useEffect(() => {
    const check = () => {
      setIsPortraitMobile(isTouchDevice() && window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", () => setTimeout(check, 200));
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    portraitQuery.addEventListener("change", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      portraitQuery.removeEventListener("change", check);
    };
  }, []);

  return isPortraitMobile;
}

/**
 * @deprecated Use useGameLayoutMode() instead.
 * Kept for backward compatibility — returns true when mode is 'wide' or 'medium'.
 */
export function useHasDualPanelGameViewport(): boolean {
  const mode = useGameLayoutMode();
  return mode === 'wide' || mode === 'medium';
}

/**
 * @deprecated Use useGameLayoutMode() instead.
 * Kept for backward compatibility.
 */
export function useIsCompactGameViewport(): boolean {
  const mode = useGameLayoutMode();
  return mode === 'compact';
}

import { type ReactNode } from 'react';
import { useGameLayoutMode, type GameLayoutMode } from '@/hooks/use-mobile';

interface GameLayoutProps {
  /** Content for the left sidebar (game info, score, timer) */
  sidebarContent?: ReactNode;
  /** Content for the right panel (round results) — only shown in 'wide' mode */
  rightPanelContent?: ReactNode;
  /** The map + any overlays (FloatingHUD, result popups, etc.) */
  children: ReactNode;
  /** Optional aria label for the main container */
  ariaLabel?: string;
}

/**
 * Shared layout component for all game screens.
 *
 * 3 modes:
 * - **compact** (< 640px or portrait touch): map fullscreen, no sidebar
 * - **medium** (640–1024px landscape): slim left sidebar + map
 * - **wide** (> 1024px): left sidebar + map + right result panel
 */
export default function GameLayout({
  sidebarContent,
  rightPanelContent,
  children,
  ariaLabel = 'Pantalla de juego',
}: GameLayoutProps) {
  const layoutMode = useGameLayoutMode();
  const isCompact = layoutMode === 'compact';
  const isWide = layoutMode === 'wide';
  const hasSidebar = !isCompact;

  const layoutClass = isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(22rem,28vw,28rem)_minmax(0,1fr)_clamp(14rem,22vw,18rem)]'
      : 'grid grid-cols-[clamp(22rem,30vw,28rem)_minmax(0,1fr)]';

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass}`}
      role="main"
      aria-label={ariaLabel}
    >
      {/* Left sidebar */}
      {hasSidebar && sidebarContent && (
        <div className="flex min-h-0 flex-col px-3 py-3 gap-2 border-r border-border bg-card/50 overflow-y-auto overflow-x-hidden">
          {sidebarContent}
        </div>
      )}

      {/* Map area — h-full gives children explicit height in grid context */}
      <div className="relative h-full min-w-0 overflow-hidden">
        {children}
      </div>

      {/* Right panel (wide only) */}
      {isWide && rightPanelContent && (
        <div className="min-h-0 overflow-y-auto border-l border-border bg-card/40">
          {rightPanelContent}
        </div>
      )}
    </div>
  );
}

/** Re-export for convenience */
export { useGameLayoutMode, type GameLayoutMode };

import { type ReactNode } from 'react';

interface FloatingHUDProps {
  cityName: string;
  /** Badges/pills to show below city name (round, streak, multiplier, etc.) */
  badges?: ReactNode;
  /** Score display */
  score: number;
  scorePop?: boolean;
  floatPoints?: number | null;
  /** Bottom section (timer bar, etc.) */
  bottomContent?: ReactNode;
}

/**
 * Floating glass-morphism HUD overlay for compact (mobile) game layouts.
 * Renders as an absolutely-positioned overlay on top of the map.
 * Parent must have `position: relative`.
 */
export default function FloatingHUD({
  cityName,
  badges,
  score,
  scorePop = false,
  floatPoints,
  bottomContent,
}: FloatingHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-20">
      <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
          {/* Left: city + badges */}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Encuentra</p>
            <p
              className="break-words font-bold leading-tight text-sm"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {cityName}
            </p>
            {badges && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                {badges}
              </div>
            )}
          </div>

          {/* Right: score */}
          <div className="relative shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Puntos</p>
            <p
              className={`text-lg font-mono font-bold leading-none ${scorePop ? 'animate-score-pop' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
              aria-live="polite"
            >
              {score.toLocaleString()}
            </p>
            {floatPoints != null && (
              <span className="absolute -top-2 right-0 text-[10px] font-bold text-green-400 animate-float-up whitespace-nowrap pointer-events-none">
                +{floatPoints.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Bottom section (timer, etc.) */}
        {bottomContent && <div className="col-span-2 mt-1">{bottomContent}</div>}
      </div>
    </div>
  );
}

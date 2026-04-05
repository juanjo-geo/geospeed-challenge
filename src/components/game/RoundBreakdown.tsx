import { useState } from 'react';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';

interface RoundBreakdownProps {
  rounds: RoundResult[];
}

function getRoundColor(distance: number): string {
  if (distance < 200) return 'text-green-400';
  if (distance < 500) return 'text-emerald-400';
  if (distance < 1000) return 'text-yellow-400';
  if (distance < 2000) return 'text-orange-400';
  return 'text-red-400';
}

function getRoundEmoji(distance: number): string {
  if (distance < 50) return '🎯';
  if (distance < 200) return '🔥';
  if (distance < 500) return '👏';
  if (distance < 1000) return '👍';
  if (distance < 2000) return '👀';
  return '😬';
}

export default function RoundBreakdown({ rounds }: RoundBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  if (rounds.length === 0) return null;

  return (
    <div className="mb-5">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border bg-muted/50 text-xs font-bold text-muted-foreground hover:bg-muted transition-all active:scale-[0.97]"
        aria-expanded={expanded}
      >
        📊 Detalle por ronda
        <span className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ease-out ${expanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="bg-muted/30 rounded-lg border border-border overflow-hidden divide-y divide-border/50 max-h-[400px] overflow-y-auto">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_4rem_2.8rem_2.8rem_3.5rem] gap-1 px-3 py-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
            <span>#</span>
            <span>Ciudad</span>
            <span className="text-right">Dist.</span>
            <span className="text-right">Seg.</span>
            <span className="text-right">Mult.</span>
            <span className="text-right">Pts</span>
          </div>
          {rounds.map((r, i) => {
            const best = rounds.reduce((b, x) => x.totalPoints > b.totalPoints ? x : b, rounds[0]);
            const isBest = r === best;
            const multColor = r.multiplier >= 2 ? 'text-green-400' : r.multiplier >= 1 ? 'text-yellow-400' : 'text-red-400';
            return (
              <div
                key={i}
                className={`grid grid-cols-[2rem_1fr_4rem_2.8rem_2.8rem_3.5rem] gap-1 px-3 py-2 items-center text-xs ${isBest ? 'bg-primary/5' : ''}`}
              >
                <span className="text-muted-foreground font-mono">{getRoundEmoji(r.distance)}</span>
                <span className={`font-medium truncate ${getRoundColor(r.distance)}`}>
                  {r.city.name}, <span className="text-muted-foreground font-normal">{r.city.country}</span>
                  {isBest && <span className="ml-1 text-[9px] text-primary">★</span>}
                </span>
                <span className="text-right font-mono text-muted-foreground">{formatDistance(r.distance)}</span>
                <span className="text-right font-mono text-muted-foreground">{r.timeUsed}s</span>
                <span className={`text-right font-mono font-bold ${multColor}`}>×{r.multiplier}</span>
                <span className="text-right font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  {r.totalPoints}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

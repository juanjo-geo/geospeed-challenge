import { useEffect, useRef } from 'react';

interface TimerBarProps {
  timeLeft: number;
  maxTime: number;
  isRunning: boolean;
  compact?: boolean;
}

export default function TimerBar({ timeLeft, maxTime, isRunning, compact = false }: TimerBarProps) {
  const pct = (timeLeft / maxTime) * 100;
  const barRef = useRef<HTMLDivElement>(null);

  const color = timeLeft > 10 ? 'hsl(var(--primary))' : timeLeft > 5 ? 'hsl(36 100% 50%)' : 'hsl(var(--destructive))';

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.transition = isRunning ? 'width 200ms linear' : 'none';
    }
  }, [isRunning]);

  return (
    <div className="w-full">
      <div className={`mb-1 flex justify-between font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="text-muted-foreground">⏱ TIEMPO</span>
        <span style={{ color }} className="font-bold">{timeLeft}s</span>
      </div>
      <div className={`w-full rounded-full bg-muted overflow-hidden ${compact ? 'h-2' : 'h-2.5'}`}>
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 200ms linear, background-color 300ms',
          }}
        />
      </div>
    </div>
  );
}

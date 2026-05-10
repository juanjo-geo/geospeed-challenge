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
  const isUrgent = timeLeft <= 5;
  const isWarning = timeLeft <= 10 && timeLeft > 5;

  const isCritical = timeLeft <= 3;
  const color = isUrgent ? 'hsl(var(--destructive))' : isWarning ? 'hsl(36 100% 50%)' : 'hsl(var(--primary))';

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.transition = isRunning ? 'width 200ms linear' : 'none';
    }
  }, [isRunning]);

  return (
    <div className={`w-full ${isCritical && isRunning ? 'animate-heartbeat' : ''}`}>
      <div className={`mb-1 flex justify-between font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="text-muted-foreground">⏱ TIEMPO</span>
        <span
          className={isCritical ? 'font-black animate-pulse text-lg' : isUrgent ? 'font-black animate-pulse' : 'font-bold'}
          style={{ color, textShadow: isCritical ? '0 0 10px hsl(0 84% 60% / 0.8)' : 'none' }}
        >{timeLeft}s</span>
      </div>
      <div
        className={`w-full rounded-full bg-muted overflow-hidden transition-shadow duration-500 ${compact ? 'h-2' : 'h-2.5'} ${isUrgent ? 'timer-danger-glow' : ''}`}
      >
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 200ms linear, background-color 300ms',
            boxShadow: isCritical
              ? '0 0 12px hsl(0 84% 60% / 0.9), 0 0 24px hsl(0 84% 60% / 0.4)'
              : isUrgent
              ? '0 0 8px hsl(0 84% 60% / 0.7)'
              : isWarning
              ? '0 0 6px hsl(36 100% 50% / 0.5)'
              : '0 0 4px hsl(var(--primary) / 0.3)',
          }}
        />
      </div>
    </div>
  );
}
